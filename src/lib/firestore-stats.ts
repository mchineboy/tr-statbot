import { firestore } from "./firestore";
import { dye, Logger } from "./util/console-helper";
import { firestore as FirebaseFirestore } from "firebase-admin";

type UserStatus = { uid: string; optin: boolean };

// Create collection references
const chatCollection = () => firestore.collection('chat');
const presenceCollection = () => firestore.collection('presence');
const songsCollection = () => firestore.collection('songs');
const playingCollection = () => firestore.collection('playing');
const usersCollection = () => firestore.collection('users');

export default class FirestoreStats extends Logger {
  db: FirebaseFirestore.Firestore;
  isInitialized: boolean;

  constructor() {
    super("Firestore");
    this.isInitialized = false;
    this.db = firestore;

    this.initialize();
  }

  async initialize() {
    try {
      // We don't need to explicitly create collections in Firestore
      // They are created automatically when documents are added
      this.info("Firestore initialized successfully");
      this.isInitialized = true;
    } catch (e) {
      const { message } = e as Error;
      this.error(dye`Initialization failed: ${message}`);
      process.exit(1);
    }
  }

  async storeChat(uid: string, timestamp: number) {
    if (!this.isInitialized) {
      return Promise.reject("Firestore Connection not initialized!");
    }
    
    timestamp = Math.round(timestamp);
    
    return chatCollection().add({
      uid,
      timestamp,
      created_at: FirebaseFirestore.FieldValue.serverTimestamp()
    });
  }

  async storePresence(uid: string, timestamp: number) {
    if (!this.isInitialized) {
      return Promise.reject("Firestore Connection not initialized!");
    }
    
    timestamp = Math.round(timestamp);
    
    return presenceCollection().add({
      uid,
      timestamp,
      created_at: FirebaseFirestore.FieldValue.serverTimestamp()
    });
  }

  async storePlayer(uid: string, timestamp: number, song: Record<string, unknown>, songObj: Record<string, unknown>) {
    if (!this.isInitialized) {
      return Promise.reject("Firestore Connection not initialized!");
    }
  
    timestamp = Math.round(timestamp);
  
    // Store song data - use encoded URL as document ID
    const songUrl = songObj.url as string;
    if (!songUrl) {
      return Promise.reject("Song URL is required");
    }
  
    // Encode the URL to make it safe for Firestore document ID
    // This replaces invalid characters with valid alternatives
    const encodedUrl = Buffer.from(songUrl).toString('base64')
      .replace(/\//g, '_')
      .replace(/\+/g, '-')
      .replace(/=/g, '');
  
    // First add/update the song
    await songsCollection().doc(encodedUrl).set({
      ...songObj,
      originalUrl: songUrl // Store the original URL as a field
    }, { merge: true });
  
    // Then add the playing record
    return playingCollection().add({
      ...song,
      timestamp,
      created_at: FirebaseFirestore.FieldValue.serverTimestamp()
    });
  }

  async storeUserStatus(uid: string, optin: boolean) {
    if (!this.isInitialized) {
      return Promise.reject("Firestore Connection not initialized!");
    }

    return usersCollection().doc(uid).set({ 
      uid, 
      optin,
      updated_at: FirebaseFirestore.FieldValue.serverTimestamp() 
    }, { merge: true });
  }

  async checkStatus(uid: string): Promise<UserStatus> {
    if (!this.isInitialized) {
      return Promise.reject("Firestore Connection not initialized!");
    }

    const doc = await usersCollection().doc(uid).get();
    
    if (!doc.exists) {
      return Promise.reject("No User found with UID: " + uid);
    }

    return doc.data() as UserStatus;
  }

  async getUser(uid: string, optin: boolean) {
    if (!this.isInitialized) {
      return;
    }

    const querySnapshot = await usersCollection()
      .where("uid", "==", uid)
      .where("optin", "==", optin)
      .get();
    
    return querySnapshot.docs.map(doc => doc.data());
  }

  async playingHours(uid: string) {
    if (!this.isInitialized) {
      return { rows: [] };
    }
    
    // First get all songs played by the user
    const playingSnapshot = await playingCollection()
      .where("uid", "==", uid)
      .get();
    
    // Get list of all played song URLs
    const songUrls = playingSnapshot.docs.map(doc => doc.data().url);
    
    // If no songs, return zero total
    if (songUrls.length === 0) {
      return { rows: [{ total: 0 }] };
    }
    
    // Fetch the song durations - need to batch if many urls
    const batchSize = 10; // Firestore IN query supports max 10 values
    let totalDuration = 0;
    
    for (let i = 0; i < songUrls.length; i += batchSize) {
      const batch = songUrls.slice(i, i + batchSize);
      
      const songsSnapshot = await songsCollection()
        .where("url", "in", batch)
        .get();
      
      songsSnapshot.forEach(doc => {
        const duration = doc.data().duration;
        if (duration) {
          totalDuration += Number(duration);
        }
      });
    }
    
    return { rows: [{ total: totalDuration }] };
  }

  async getChatStats(uid: string) {
    if (!this.isInitialized) {
      return null;
    }
    
    // Get all chat messages from the user in the last 30 days
    const thirtyDaysAgo = Date.now() / 1000 - 2592000;
    
    const chatSnapshot = await chatCollection()
      .where("uid", "==", uid)
      .where("timestamp", ">=", thirtyDaysAgo)
      .orderBy("timestamp", "asc")
      .get();
    
    const messages = chatSnapshot.docs.map(doc => doc.data());
    
    // Calculate total time chatting (messages within 5 minutes of each other)
    let totalElapsedTime = 0;
    let hourCounts: Record<number, number> = {};
    
    for (let i = 1; i < messages.length; i++) {
      const curr = messages[i].timestamp as number;
      const prev = messages[i-1].timestamp as number;
      
      // Add to hourly distribution
      const hour = new Date(curr * 1000).getUTCHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      
      // Calculate time between messages
      if (curr - prev <= 300) { // 5 minutes = 300 seconds
        totalElapsedTime += (curr - prev);
      }
    }
    
    // Find most active hour
    let mostActiveHour = 0;
    let maxCount = 0;
    
    Object.entries(hourCounts).forEach(([hour, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostActiveHour = parseInt(hour);
      }
    });
    
    return {
      totalTime: totalElapsedTime,
      activeHours: mostActiveHour,
    };
  }

  async getTopSong(uid: string) {
    if (!this.isInitialized) {
      return { rows: [] };
    }
    
    const playingSnapshot = await playingCollection()
      .where("uid", "==", uid)
      .where("title", "!=", null)
      .get();
    
    // Count plays by URL
    const playCountsByUrl: Record<string, { url: string, title: string, plays: number }> = {};
    
    for (const doc of playingSnapshot.docs) {
      const data = doc.data();
      const url = data.url as string;
      const title = data.title as string;
      
      if (!playCountsByUrl[url]) {
        playCountsByUrl[url] = { url, title, plays: 0 };
      }
      
      playCountsByUrl[url].plays++;
    }
    
    // Convert to array and sort by play count
    const songPlayCounts = Object.values(playCountsByUrl)
      .sort((a, b) => b.plays - a.plays);
    
    return { rows: songPlayCounts };
  }

  async getMostLikedSong(uid: string) {
    if (!this.isInitialized) {
      return { rows: [] };
    }
    
    const playingSnapshot = await playingCollection()
      .where("uid", "==", uid)
      .where("title", "!=", null)
      .get();
    
    // Find song with most likes+grabs
    const likesByUrl: Record<string, { url: string, title: string, likes: number }> = {};
    
    for (const doc of playingSnapshot.docs) {
      const data = doc.data();
      const url = data.url as string;
      const title = data.title as string;
      const likes = (data.likes || 0) as number;
      const grabs = (data.grabs || 0) as number;
      
      if (!likesByUrl[url] || (likes + grabs) > likesByUrl[url].likes) {
        likesByUrl[url] = { 
          url, 
          title, 
          likes: likes + grabs 
        };
      }
    }
    
    // Convert to array and sort by likes
    const songLikes = Object.values(likesByUrl)
      .sort((a, b) => b.likes - a.likes);
    
    return { rows: songLikes };
  }

  async getOnlinePresence(uid: string) {
    if (!this.isInitialized) {
      return { rows: [{ totalseconds: 0 }] };
    }
    
    const presenceSnapshot = await presenceCollection()
      .where("uid", "==", uid)
      .orderBy("timestamp", "asc")
      .get();
    
    const presenceData = presenceSnapshot.docs.map(doc => doc.data().timestamp);
    
    // Calculate total presence duration - considers consecutive timestamps within 10 minutes
    let totalSeconds = 0;
    const SESSION_TIMEOUT = 10 * 60; // 10 minutes in seconds
    
    for (let i = 1; i < presenceData.length; i++) {
      const curr = presenceData[i] as number;
      const prev = presenceData[i-1] as number;
      
      if (curr - prev <= SESSION_TIMEOUT) {
        totalSeconds += (curr - prev);
      }
    }
    
    return { rows: [{ totalseconds: totalSeconds }] };
  }
}