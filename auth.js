function initDemoLogin() {
    const demoLoginBtn = document.getElementById('demo-login-btn');
    const demoLoginFooter = document.getElementById('demo-login-footer');

    if (demoLoginBtn) {
        demoLoginBtn.addEventListener('click', handleDemoLogin);
    }

    if (demoLoginFooter) {
        demoLoginFooter.addEventListener('click', handleDemoLogin);
    }
}

function handleDemoLogin() {
    const db = JSON.parse(localStorage.getItem('movani_db') || '{}');

    if (!db.users || !db.users.find(u => u.email === 'demo@movani.com')) {
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
                content: "Denis Villeneuve has created a visual and narrative masterpiece. The world-building is incredible, the characters are compelling, and the cinematography is breathtaking.",
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
                content: "Attack on Titan's final season delivers on every promise. The animation, the soundtrack, the emotional payoff - everything comes together perfectly.",
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

        localStorage.setItem('movani_db', JSON.stringify(db));
    }

    const demoUser = {
        id: 999999,
        username: "demo_user",
        email: "demo@movani.com",
        password: "demo123",
        displayName: "Demo User",
        avatar: "DU",
        joined: new Date().toISOString()
    };

    localStorage.setItem('currentUser', JSON.stringify(demoUser));
    showMessage('Logged in as demo user! You can explore all features.', 'success');

    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

document.addEventListener('DOMContentLoaded', function() {
    initializeAuth();
});

function initializeAuth() {
    const isLoginPage = window.location.pathname.includes('login.html');
    const isSignupPage = window.location.pathname.includes('signup.html');

    if (isLoginPage || isSignupPage) {
        initPasswordToggle();
        initFormValidation();
        initSocialButtons();
        initForgotPassword();
        initAvatarUpload();
        initGenrePreferences();
        initDemoLogin();

        const hash = window.location.hash.replace('#', '');
        if (hash === 'signup' && isLoginPage) {
            showTab('signup');
        } else if (hash === 'login' && isSignupPage) {
            showTab('login');
        }
    }

    checkAuthStatus();
}

function showTab(tabName) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const loginTab = document.querySelector('.auth-tab:nth-child(1)');
    const signupTab = document.querySelector('.auth-tab:nth-child(2)');

    if (tabName === 'login') {
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
        if (loginTab) loginTab.classList.add('active');
        if (signupTab) signupTab.classList.remove('active');
    } else {
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
        if (signupTab) signupTab.classList.add('active');
        if (loginTab) loginTab.classList.remove('active');
    }
}

function checkAuthStatus() {
    const currentUser = localStorage.getItem('currentUser');
    const userDropdown = document.querySelector('.user-dropdown');
    const loginLinks = document.querySelectorAll('a[href*="login"], a[href*="signup"]');

    if (currentUser && userDropdown) {
        const user = JSON.parse(currentUser);
        const userBtn = userDropdown.querySelector('.user-btn span');
        if (userBtn) userBtn.textContent = user.displayName || user.username;
        loginLinks.forEach(link => link.style.display = 'none');
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}
