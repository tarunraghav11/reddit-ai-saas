import {supabase} from '../config/supabase.js';

export const savePosts = async (posts , query) => {
    try {
        const payload = posts.map((post) => ({
            id : post.id,
            title : post.title,
            subreddit : post.subreddit,
            upvotes : post.upvotes,
            comments : post.comments,
            url : post.url,
            created_at : post.createdAt,
            query : query
        }));
        //upsert : update ifexists and insert if new */ 
        const {error} = await supabase.from('reddit_posts').upsert(payload, { onConflict: 'id' });
        if (error) {
            throw new Error(`Supabase upsert error: ${error.message}`);
        }
    } catch (error) {
        console.error(" DB Insert Error:", error.message);
        throw error;
    
    }
};