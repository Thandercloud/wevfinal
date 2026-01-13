const DB_NAME = 'movani_db';

class LocalDB {
    constructor() {
        this.initDB();
    }

    createDemoAccount() {
        const demoUser = {
            id: 999999,
            username: "demo_user",
            email: "demo@movani.com",
            password: "demo123",
            displayName: "Demo User",
            avatar: "DU",
            joined: new Date().toISOString(),
            preferences: {
                genres: ["Action", "Animation", "Sci-Fi", "Drama", "Fantasy"],
                content: {
                    movies: true,
                    anime: true,
                    tvshows: false
                }
            },
            stats: {
                reviews: 12,
                watchlist: 8,
                following: 24,
                followers: 18
            }
        };

        const db = this.getDB();

        const existingDemo = db.users?.find(u => u.email === demoUser.email);
        if (existingDemo) {
            return { success: true, user: existingDemo };
        }

        if (!db.users) db.users = [];
        db.users.push(demoUser);

        const demoWatchlist = [
            { id: 1001, userId: demoUser.id, itemId: 1, itemType: 'movie', added: '2024-01-15' },
            { id: 1002, userId: demoUser.id, itemId: 101, itemType: 'anime', added: '2024-01-20' },
            { id: 1003, userId: demoUser.id, itemId: 2, itemType: 'movie', added: '2024-02-10' },
            { id: 1004, userId: demoUser.id, itemId: 102, itemType: 'anime', added: '2024-02-15' }
        ];

        if (!db.watchlist) db.watchlist = [];
        demoWatchlist.forEach(item => db.watchlist.push(item));

        const demoReviews = [
            {
                id: 9991,
                userId: demoUser.id,
                movieId: 1,
                user: demoUser.displayName,
                avatar: demoUser.avatar,
                rating: 9.5,
                title: "A Masterpiece of Sci-Fi Cinema",
                content: "Denis Villeneuve has created a visual and narrative masterpiece. The world-building is incredible, the characters are compelling, and the cinematography is breathtaking. This is what epic cinema is all about.",
                metrics: { overall: 9.5, story: 9.5, characters: 9.0, visuals: 10, sound: 9.5 },
                spoiler: false,
                privacy: 'public',
                date: '2024-03-10',
                likes: 156,
                comments: []
            },
            {
                id: 9992,
                userId: demoUser.id,
                movieId: 101,
                user: demoUser.displayName,
                avatar: demoUser.avatar,
                rating: 10,
                title: "Perfect Ending to an Epic Saga",
                content: "Attack on Titan's final season delivers on every promise. The animation, the soundtrack, the emotional payoff - everything comes together to create one of the greatest endings in anime history. Isayama's vision is fully realized.",
                metrics: { overall: 10, story: 10, characters: 10, visuals: 9.8, sound: 10 },
                spoiler: false,
                privacy: 'public',
                date: '2023-11-05',
                likes: 342,
                comments: []
            }
        ];

        if (!db.reviews) db.reviews = [];
        demoReviews.forEach(review => db.reviews.push(review));

        const demoRatings = [
            { id: 9991, userId: demoUser.id, movieId: 1, rating: 9.5, date: '2024-03-10' },
            { id: 9992, userId: demoUser.id, movieId: 101, rating: 10, date: '2023-11-05' },
            { id: 9993, userId: demoUser.id, movieId: 2, rating: 9.0, date: '2023-12-20' },
            { id: 9994, userId: demoUser.id, movieId: 102, rating: 9.3, date: '2023-10-15' }
        ];

        if (!db.ratings) db.ratings = [];
        demoRatings.forEach(rating => db.ratings.push(rating));

        this.saveDB(db);

        return { success: true, user: demoUser };
    }

    initDB() {
        if (!localStorage.getItem(DB_NAME)) {
            const initialData = {
                users: [],
                watchlist: [],
                reviews: [],
                ratings: [],
                movies: [],
                moviesData: [],
                animeData: []
            };
            localStorage.setItem(DB_NAME, JSON.stringify(initialData));
        }
    }

    getDB() {
        return JSON.parse(localStorage.getItem(DB_NAME)) || {};
    }

    saveDB(data) {
        localStorage.setItem(DB_NAME, JSON.stringify(data));
    }

    registerUser(username, email, password) {
        const db = this.getDB();
        const userExists = db.users.some(u => u.email === email);

        if (userExists) {
            return { success: false, message: 'User already exists' };
        }

        const newUser = {
            id: Date.now(),
            username,
            email,
            password,
            avatar: username.substring(0, 2).toUpperCase(),
            joined: new Date().toISOString()
        };

        db.users.push(newUser);
        this.saveDB(db);

        return { success: true, user: newUser };
    }

    loginUser(email, password) {
        const db = this.getDB();
        const user = db.users.find(u => u.email === email && u.password === password);

        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
            return { success: true, user };
        }

        return { success: false, message: 'Invalid credentials' };
    }

    getCurrentUser() {
        return JSON.parse(localStorage.getItem('currentUser'));
    }

    logoutUser() {
        localStorage.removeItem('currentUser');
    }

    addToWatchlist(userId, itemId, itemType) {
        const db = this.getDB();

        const existing = db.watchlist.find(w => w.userId === userId && w.itemId === itemId && w.itemType === itemType);

        if (existing) {
            return { success: false, message: 'Already in watchlist' };
        }

        db.watchlist.push({
            id: Date.now(),
            userId,
            itemId,
            itemType,
            added: new Date().toISOString()
        });

        this.saveDB(db);
        return { success: true };
    }

    removeFromWatchlist(userId, itemId) {
        const db = this.getDB();
        const initialLength = db.watchlist.length;

        db.watchlist = db.watchlist.filter(w => !(w.userId === userId && w.itemId === itemId));

        if (db.watchlist.length < initialLength) {
            this.saveDB(db);
            return { success: true };
        }

        return { success: false, message: 'Item not found in watchlist' };
    }

    getWatchlist(userId) {
        const db = this.getDB();
        return db.watchlist.filter(w => w.userId === userId);
    }

    addReview(userId, movieId, rating, content) {
        const db = this.getDB();
        const user = this.getCurrentUser();

        const newReview = {
            id: Date.now(),
            userId,
            movieId,
            user: user.username,
            avatar: user.avatar,
            rating,
            content,
            date: new Date().toISOString().split('T')[0],
            likes: 0
        };

        db.reviews.push(newReview);
        this.saveDB(db);

        return { success: true, review: newReview };
    }

    getReviews(movieId) {
        const db = this.getDB();
        return db.reviews.filter(r => r.movieId === movieId);
    }

    addRating(userId, movieId, rating) {
        const db = this.getDB();

        const existingIndex = db.ratings.findIndex(r => r.userId === userId && r.movieId === movieId);

        if (existingIndex > -1) {
            db.ratings[existingIndex].rating = rating;
        } else {
            db.ratings.push({
                id: Date.now(),
                userId,
                movieId,
                rating,
                date: new Date().toISOString()
            });
        }

        this.saveDB(db);
        return { success: true };
    }

    getAverageRating(movieId) {
        const db = this.getDB();
        const ratings = db.ratings.filter(r => r.movieId === movieId);

        if (ratings.length === 0) return 0;

        const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
        return sum / ratings.length;
    }

    getUserRating(userId, movieId) {
        const db = this.getDB();
        const rating = db.ratings.find(r => r.userId === userId && r.movieId === movieId);

        return rating ? rating.rating : null;
    }
}

function loginAsDemo() {
    const db = new LocalDB();
    const result = db.createDemoAccount();

    if (result.success) {
        localStorage.setItem('currentUser', JSON.stringify(result.user));
        alert('Logged in as demo user! You can explore all features.');
        window.location.href = 'index.html';
    }
}

const db = new LocalDB();
