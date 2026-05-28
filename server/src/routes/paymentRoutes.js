import express from "express";
import Stripe from "stripe";
import { protect } from "../middleware/authMiddleware.js";
import { supabase } from "../config/supabase.js";
import { logger } from "../utils/logger.js";

const router = express.Router();
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

const PLAN_PRICES = {
  starter: process.env.STRIPE_PRICE_STARTER_ID,
  pro: process.env.STRIPE_PRICE_PRO_ID,
};

/**
 * POST /payments/create-checkout-session
 * Creates a Stripe Checkout Session for subscription
 */
router.post("/payments/create-checkout-session", protect, async (req, res, next) => {
  try {
    if (!stripe) {
      return res.status(503).json({
        success: false,
        message: "Stripe payment integration is not configured on this server. Please check environment variables."
      });
    }

    const { planName } = req.body;

    if (!planName || !PLAN_PRICES[planName.toLowerCase()]) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing plan name. Must be 'starter' or 'pro'."
      });
    }

    const priceId = PLAN_PRICES[planName.toLowerCase()];
    const userId = req.user.id;
    const userEmail = req.user.email;

    logger.info(`[Stripe] Creating checkout session for user ${userId} | Plan: ${planName}`);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/app?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || "http://localhost:5173"}/app?payment=cancelled`,
      client_reference_id: userId,
      customer_email: userEmail,
      metadata: {
        userId,
        planName: planName.toLowerCase(),
      },
    });

    return res.status(200).json({ success: true, url: session.url });
  } catch (err) {
    logger.error(`[Stripe] Create Checkout Session Error: ${err.message}`);
    next(err);
  }
});

/**
 * POST /payments/verify-session
 * Direct client-side callback verification as a fail-safe fallback
 */
router.post("/payments/verify-session", protect, async (req, res, next) => {
  try {
    const { sessionId } = req.body;

    if (!stripe) {
      return res.status(503).json({ success: false, message: "Stripe is not configured" });
    }

    if (!sessionId) {
      return res.status(400).json({ success: false, message: "Missing sessionId" });
    }

    logger.info(`[Stripe] Directly verifying checkout session: ${sessionId}`);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid" && (session.client_reference_id === req.user.id || session.metadata?.userId === req.user.id)) {
      const planName = session.metadata?.planName || "free";
      
      logger.info(`[Stripe] Direct verification match! Upgrading user ${req.user.id} to ${planName}`);
      
      const { error } = await supabase.auth.admin.updateUserById(req.user.id, {
        app_metadata: { plan: planName },
      });

      if (error) throw error;
      
      logger.info(`[Stripe] Direct verification upgrade successful for user ${req.user.id}`);
      return res.status(200).json({ success: true, plan: planName });
    }

    return res.status(400).json({ success: false, message: "Payment status is not paid or session is unauthorized" });
  } catch (err) {
    logger.error(`[Stripe] Direct Verification Session Error: ${err.message}`);
    next(err);
  }
});

/**
 * POST /payments/webhook
 * Listens for Stripe background webhook events to upgrade/downgrade plans
 */
router.post("/payments/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe) {
    logger.warn("[Stripe Webhook] Webhook hit but Stripe is not configured");
    return res.status(503).send("Stripe is not configured");
  }

  let event;

  try {
    if (!sig || !webhookSecret) {
      logger.warn("[Stripe Webhook] Missing signature or webhook secret");
      return res.status(400).send("Webhook verification failed");
    }

    // Verify webhook signature using the captured raw body buffer
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    logger.error(`[Stripe Webhook] Signature Verification Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  logger.info(`[Stripe Webhook] Received event type: ${event.type}`);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.client_reference_id || session.metadata?.userId;
        const planName = session.metadata?.planName;

        if (userId && planName) {
          logger.info(`[Stripe Webhook] Checkout completed. Upgrading user ${userId} to ${planName}`);
          
          const { error } = await supabase.auth.admin.updateUserById(userId, {
            app_metadata: { plan: planName },
          });

          if (error) throw error;
          logger.info(`[Stripe Webhook] User ${userId} upgraded successfully.`);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        // Search user by email or retrieve from Stripe customer metadata
        const customer = await stripe.customers.retrieve(subscription.customer);
        const email = customer.email;

        if (email) {
          logger.info(`[Stripe Webhook] Subscription deleted. Downgrading customer email ${email} to free`);
          
          // Find user ID by email
          const { data: usersData, error: findErr } = await supabase.auth.admin.listUsers();
          if (findErr) throw findErr;

          const targetUser = usersData.users.find((u) => u.email === email);
          if (targetUser) {
            const { error } = await supabase.auth.admin.updateUserById(targetUser.id, {
              app_metadata: { plan: "free" },
            });
            if (error) throw error;
            logger.info(`[Stripe Webhook] User ${targetUser.id} downgraded successfully.`);
          }
        }
        break;
      }

      default:
        logger.debug(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    logger.error(`[Stripe Webhook] Event Processing Error: ${err.message}`);
    return res.status(500).send(`Webhook Processing Error: ${err.message}`);
  }
});

export default router;
