import axios from 'axios';
import { config } from '../config/env.js';

// Realistic fallback preview dataset when credentials are not yet configured or invalid
const MOCK_PAGE_DATA = {
  id: '109283746592018',
  name: 'TechSphere Global',
  category: 'Software & Technology',
  about: 'Empowering digital innovation with next-generation automation, cloud solutions, and developer tools.',
  fanCount: 24850,
  followersCount: 26120,
  link: 'https://facebook.com/techsphere.global',
  website: 'https://techsphere.io',
  phone: '+1 (555) 234-5678',
  emails: ['contact@techsphere.io'],
  isVerified: true,
  verificationStatus: 'verified',
  pictureUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80',
  coverUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&auto=format&fit=crop&q=80',
  isLive: false,
  dataSource: 'demo'
};

const MOCK_POSTS_DATA = [
  {
    id: 'post_109283746592018_101',
    message: '🚀 Exciting news! We just launched our AI-Powered Social Automation Suite v3.2. Schedule, analyze, and optimize your social workflows seamlessly in one unified cockpit.',
    createdTime: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    mediaUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
    permalinkUrl: 'https://facebook.com/techsphere.global/posts/101',
    reactionsCount: 342,
    likesCount: 289,
    commentsCount: 48,
    sharesCount: 36,
    engagementTotal: 426
  },
  {
    id: 'post_109283746592018_102',
    message: '💡 Pro Tip for Social Growth: Consistent timing combined with rich media generates 3.4x higher organic engagement. Which day of the week performs best for your audience?',
    createdTime: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    mediaUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
    permalinkUrl: 'https://facebook.com/techsphere.global/posts/102',
    reactionsCount: 512,
    likesCount: 440,
    commentsCount: 94,
    sharesCount: 52,
    engagementTotal: 658
  },
  {
    id: 'post_109283746592018_103',
    message: 'Join us live this Thursday for an exclusive workshop on "Automating Enterprise Social Operations with Node.js and Meta Graph API"!',
    createdTime: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    mediaUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&auto=format&fit=crop&q=80',
    permalinkUrl: 'https://facebook.com/techsphere.global/posts/103',
    reactionsCount: 219,
    likesCount: 185,
    commentsCount: 27,
    sharesCount: 19,
    engagementTotal: 265
  },
  {
    id: 'post_109283746592018_104',
    message: '📊 Weekly Roundup: Cloud infrastructure uptime reached 99.99% across all availability zones this quarter. Huge thanks to our engineering team!',
    createdTime: new Date(Date.now() - 120 * 3600 * 1000).toISOString(),
    mediaUrl: '',
    permalinkUrl: 'https://facebook.com/techsphere.global/posts/104',
    reactionsCount: 147,
    likesCount: 130,
    commentsCount: 15,
    sharesCount: 8,
    engagementTotal: 170
  }
];

const getGraphErrorMessage = (error, fallback) => {
  const graphError = error.response?.data?.error;

  if (graphError?.error_subcode === 2069032 || graphError?.error_user_title?.includes('User Access Token')) {
    return 'User Access Token is not supported. A Page Access Token is required for this call. In Meta Graph API Explorer, select your Page under the "User or Page" dropdown to generate a Page Access Token, update FACEBOOK_PAGE_ACCESS_TOKEN in server/.env, and restart the backend.';
  }

  if (graphError?.code === 190 && graphError?.error_subcode === 460) {
    return 'Meta invalidated this access token (OAuth error 190, subcode 460). Generate a new Page Access Token, update FACEBOOK_PAGE_ACCESS_TOKEN in server/.env, and restart the backend.';
  }

  if (graphError?.code === 190) {
    return `Meta access token expired or invalid: ${graphError.message}. Generate a fresh Page Access Token and update FACEBOOK_PAGE_ACCESS_TOKEN in server/.env.`;
  }

  return graphError?.error_user_msg || graphError?.message || error.message || fallback;
};

class FacebookService {
  constructor() {
    this.client = axios.create({
      baseURL: `${config.facebook.baseUrl}/${config.facebook.apiVersion}`,
      timeout: 10000
    });
    this._resolvedPageToken = null;
  }

  /**
   * Check whether real Facebook credentials have been configured
   */
  isConfigured() {
    const { pageId, pageAccessToken } = config.facebook;
    const isPlaceholderId = !pageId || pageId === 'your_facebook_page_id';
    const isPlaceholderToken = !pageAccessToken || pageAccessToken === 'your_long_lived_page_access_token';
    return !isPlaceholderId && !isPlaceholderToken;
  }

  /**
   * Automatically resolve the Page Access Token.
   * If the user provided a User Access Token in .env, this resolves the
   * real Page Access Token from /me/accounts for config.facebook.pageId.
   */
  async getEffectivePageToken() {
    if (this._resolvedPageToken) {
      return this._resolvedPageToken;
    }

    const rawToken = config.facebook.pageAccessToken;
    if (!rawToken || !this.isConfigured()) {
      return rawToken;
    }

    try {
      // Check identity of current token
      const meRes = await this.client.get('/me', {
        params: { access_token: rawToken }
      });

      // If /me returned the Page ID itself, this is already a Page Access Token!
      if (meRes.data?.id === config.facebook.pageId) {
        this._resolvedPageToken = rawToken;
        return rawToken;
      }

      // If /me returned a user account, query /me/accounts to get the Page Access Token
      const accountsRes = await this.client.get('/me/accounts', {
        params: { access_token: rawToken }
      });

      const pages = accountsRes.data?.data || [];
      const match = pages.find((p) => p.id === config.facebook.pageId);

      if (match && match.access_token) {
        console.info(`[Facebook] Automatically resolved Page Access Token for Page "${match.name}" (${match.id}) from User Access Token.`);
        this._resolvedPageToken = match.access_token;
        return match.access_token;
      }
    } catch (err) {
      console.warn('[Facebook] Auto-resolution of Page Access Token notice:', err.message);
    }

    // Fallback to configured token
    return rawToken;
  }

  /**
   * Test current Facebook credentials connection
   */
  async testConnection() {
    if (!this.isConfigured()) {
      const result = {
        isConnected: false,
        isConfigured: false,
        message: 'Credentials in server/.env are placeholder values or missing.',
        pageId: config.facebook.pageId || null
      };
      console.warn(`[Facebook] Connection not established. Reason: ${result.message}`);
      return result;
    }

    try {
      const pageAccessToken = await this.getEffectivePageToken();

      const response = await this.client.get(`/${config.facebook.pageId}`, {
        params: {
          fields: 'id,name,verification_status',
          access_token: pageAccessToken
        }
      });

      // Verify Page posts permission
      let postPermissionVerified = true;
      let permissionWarning = null;
      try {
        await this.client.get(`/${config.facebook.pageId}/posts`, {
          params: {
            limit: 1,
            access_token: pageAccessToken
          }
        });
      } catch (postErr) {
        postPermissionVerified = false;
        permissionWarning = getGraphErrorMessage(postErr, 'Cannot read Page posts with this token.');
      }

      if (!postPermissionVerified) {
        console.warn(`[Facebook] Page "${response.data.name}" identified, but post permissions failed: ${permissionWarning}`);
        return {
          isConnected: false,
          isConfigured: true,
          message: permissionWarning,
          pageId: response.data.id,
          pageName: response.data.name
        };
      }

      console.info(
        `[Facebook] Connection established for Page "${response.data.name || 'Unnamed Page'}" (${response.data.id}), Graph API ${config.facebook.apiVersion}.`
      );

      return {
        isConnected: true,
        isConfigured: true,
        message: 'Connected to Facebook Graph API successfully with valid Page Access Token.',
        pageId: response.data.id,
        pageName: response.data.name
      };
    } catch (error) {
      const fbError = error.response?.data?.error;
      const message = getGraphErrorMessage(error, 'Unable to authenticate with Facebook Graph API')
        .replace(config.facebook.pageAccessToken, '[REDACTED]');
      const errorCode = fbError?.code ? ` (code ${fbError.code}${fbError.error_subcode ? `, subcode ${fbError.error_subcode}` : ''})` : '';
      console.error(`[Facebook] Connection not established. Reason: ${message}${errorCode}`);

      return {
        isConnected: false,
        isConfigured: true,
        message,
        code: fbError?.code,
        subcode: fbError?.error_subcode
      };
    }
  }

  /**
   * Fetch connected Page details
   */
  async getPageDetails() {
    if (!this.isConfigured()) {
      return {
        ...MOCK_PAGE_DATA,
        apiVersion: config.facebook.apiVersion,
        notice: 'Displaying demo data. To connect your live Facebook Page, set FACEBOOK_PAGE_ID and FACEBOOK_PAGE_ACCESS_TOKEN in server/.env.'
      };
    }

    try {
      const pageAccessToken = await this.getEffectivePageToken();
      const fields = [
        'id',
        'name',
        'about',
        'category',
        'fan_count',
        'followers_count',
        'link',
        'website',
        'phone',
        'emails',
        'is_verified',
        'verification_status',
        'cover',
        'picture.type(large)'
      ].join(',');

      const response = await this.client.get(`/${config.facebook.pageId}`, {
        params: {
          fields,
          access_token: pageAccessToken
        }
      });

      const data = response.data;

      return {
        id: data.id,
        name: data.name,
        about: data.about || '',
        category: data.category || 'General',
        fanCount: data.fan_count || data.followers_count || 0,
        followersCount: data.followers_count || data.fan_count || 0,
        link: data.link || `https://facebook.com/${data.id}`,
        website: data.website || '',
        phone: data.phone || '',
        emails: data.emails || [],
        isVerified: !!data.is_verified || data.verification_status === 'blue_verified',
        verificationStatus: data.verification_status || (data.is_verified ? 'verified' : 'unverified'),
        pictureUrl: data.picture?.data?.url || '',
        coverUrl: data.cover?.source || '',
        apiVersion: config.facebook.apiVersion,
        isLive: true,
        dataSource: 'facebook_graph_api'
      };
    } catch (error) {
      console.error('Facebook Graph API Error (getPageDetails):', error.response?.data?.error?.message || error.message);
      const graphError = new Error(getGraphErrorMessage(error, 'Failed to fetch Page details from Facebook Graph API.'));
      graphError.statusCode = error.response?.status || 502;
      throw graphError;
    }
  }

  /**
   * Fetch recent Page posts with engagement stats
   */
  async getRecentPosts(limit = 20) {
    if (!this.isConfigured()) {
      return {
        posts: MOCK_POSTS_DATA,
        total: MOCK_POSTS_DATA.length,
        isLive: false,
        dataSource: 'demo'
      };
    }

    try {
      const pageAccessToken = await this.getEffectivePageToken();
      const fields = [
        'id',
        'message',
        'story',
        'created_time',
        'full_picture',
        'permalink_url',
        'shares',
        'likes.summary(true)',
        'reactions.summary(true)',
        'comments.summary(true)'
      ].join(',');

      const response = await this.client.get(`/${config.facebook.pageId}/posts`, {
        params: {
          fields,
          limit,
          access_token: pageAccessToken
        }
      });

      const rawPosts = response.data?.data || [];

      const posts = rawPosts.map((p) => {
        const reactionsCount = p.reactions?.summary?.total_count ?? (p.likes?.summary?.total_count || 0);
        const likesCount = p.likes?.summary?.total_count || 0;
        const commentsCount = p.comments?.summary?.total_count || 0;
        const sharesCount = p.shares?.count || 0;
        const engagementTotal = reactionsCount + commentsCount + sharesCount;

        return {
          id: p.id,
          message: p.message || p.story || '',
          createdTime: p.created_time,
          mediaUrl: p.full_picture || '',
          permalinkUrl: p.permalink_url || `https://facebook.com/${p.id}`,
          reactionsCount,
          likesCount,
          commentsCount,
          sharesCount,
          engagementTotal
        };
      });

      return {
        posts,
        total: posts.length,
        isLive: true,
        dataSource: 'facebook_graph_api'
      };
    } catch (error) {
      console.error('Facebook Graph API Error (getRecentPosts):', error.response?.data?.error?.message || error.message);
      const graphError = new Error(getGraphErrorMessage(error, 'Failed to fetch Page posts from Facebook Graph API.'));
      graphError.statusCode = error.response?.status || 502;
      throw graphError;
    }
  }

  /**
   * Fetch aggregated analytics and insights
   */
  async getAnalytics() {
    const pageData = await this.getPageDetails();
    const postsResult = await this.getRecentPosts(25);
    const posts = postsResult.posts || [];

    const totalPosts = posts.length;
    const totalReactions = posts.reduce((sum, p) => sum + (p.reactionsCount || 0), 0);
    const totalComments = posts.reduce((sum, p) => sum + (p.commentsCount || 0), 0);
    const totalShares = posts.reduce((sum, p) => sum + (p.sharesCount || 0), 0);
    const totalEngagement = totalReactions + totalComments + totalShares;

    const avgEngagementPerPost = totalPosts > 0 ? Math.round((totalEngagement / totalPosts) * 10) / 10 : 0;
    const engagementRate = pageData.followersCount > 0
      ? Math.round(((totalEngagement / (pageData.followersCount * (totalPosts || 1))) * 100) * 100) / 100
      : pageData.isLive ? null : 2.85;

    // Daily breakdown for visual graphs
    const recentActivity = posts.slice(0, 7).map((p, idx) => ({
      date: new Date(p.createdTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      likes: p.likesCount,
      comments: p.commentsCount,
      shares: p.sharesCount,
      total: p.engagementTotal
    }));

    return {
      overview: {
        followers: pageData.followersCount || pageData.fanCount || 0,
        followersGrowth: pageData.isLive ? null : '+4.2%',
        totalPosts,
        totalEngagement,
        engagementGrowth: pageData.isLive ? null : '+12.5%',
        avgEngagementPerPost,
        engagementRate: engagementRate === null ? null : `${engagementRate}%`,
        estimatedReach: Math.round((pageData.followersCount || 1000) * 1.8)
      },
      breakdown: {
        reactions: totalReactions,
        comments: totalComments,
        shares: totalShares
      },
      chartData: recentActivity.reverse(),
      isLive: postsResult.isLive,
      dataSource: postsResult.dataSource
    };
  }

  /**
   * Publish a new post to the connected Facebook Page
   */
  async createPost({ message, link, mediaUrl, requireMedia = false }) {
    if (requireMedia && !mediaUrl) {
      throw Object.assign(new Error('A news article image is required to publish this post'), { statusCode: 400 });
    }

    if (!this.isConfigured()) {
      return {
        id: `mock_post_${Date.now()}`,
        message,
        createdTime: new Date().toISOString(),
        mediaUrl: mediaUrl || '',
        permalinkUrl: 'https://facebook.com',
        reactionsCount: 0,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        isLive: false,
        note: 'Saved in demo mode (credentials not configured)'
      };
    }

    try {
      const pageAccessToken = await this.getEffectivePageToken();

      // If mediaUrl is provided, publish as a native Facebook photo post with caption
      if (mediaUrl) {
        try {
          const photoPayload = {
            url: mediaUrl,
            caption: message,
            access_token: pageAccessToken
          };
          const photoResponse = await this.client.post(`/${config.facebook.pageId}/photos`, photoPayload, {
            timeout: 20000
          });

          const postId = photoResponse.data.post_id || photoResponse.data.id;
          return {
            id: postId,
            message,
            createdTime: new Date().toISOString(),
            mediaUrl,
            permalinkUrl: `https://facebook.com/${postId}`,
            reactionsCount: 0,
            likesCount: 0,
            commentsCount: 0,
            sharesCount: 0,
            isLive: true
          };
        } catch (photoError) {
          if (requireMedia) {
            throw photoError;
          }
          console.warn('[Facebook] Direct photo upload fallback to feed post:', photoError.response?.data?.error?.message || photoError.message);
        }
      }

      const payload = {
        message,
        access_token: pageAccessToken
      };

      if (link) {
        payload.link = link;
      }

      const response = await this.client.post(`/${config.facebook.pageId}/feed`, payload, {
        timeout: 15000
      });

      return {
        id: response.data.id,
        message,
        createdTime: new Date().toISOString(),
        mediaUrl: mediaUrl || '',
        permalinkUrl: `https://facebook.com/${response.data.id}`,
        reactionsCount: 0,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        isLive: true
      };
    } catch (error) {
      console.error('Facebook Graph API Error (createPost):', error.response?.data?.error?.message || error.message);
      const publishError = new Error(error.response?.data?.error?.message || 'Failed to publish post to Facebook Page');
      publishError.code = error.code;
      publishError.statusCode = error.response?.status || (error.code === 'ECONNABORTED' ? 504 : 502);
      throw publishError;
    }
  }
}

export const facebookService = new FacebookService();
