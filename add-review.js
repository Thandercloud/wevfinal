document.addEventListener('DOMContentLoaded', function() {
    initializeReviewPage();
});

let currentReviewStep = 1;
let selectedTitle = null;
let reviewData = {
    titleId: null,
    rating: 0,
    reviewTitle: '',
    content: '',
    metrics: {
        overall: 5,
        story: 5,
        characters: 5,
        visuals: 5,
        sound: 5
    },
    spoiler: false,
    privacy: 'public'
};

function initializeReviewPage() {
    checkAuthentication();
    loadUserData();
    showReviewStep(1);
    checkURLParameters();
    initSearchFunctionality();
    initRatingSystem();
    initEditor();
    initMetricSliders();
    initStepNavigation();
    initFormSubmission();
    loadRecentWatched();
}

function checkAuthentication() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        alert('Please login to write a review');
        window.location.href = 'login.html';
        return;
    }
}

function loadUserData() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        document.getElementById('username').textContent = currentUser.displayName || currentUser.username;
        document.getElementById('preview-username').textContent = currentUser.displayName || currentUser.username;
        const avatarElement = document.getElementById('preview-avatar');
        if (currentUser.avatar && currentUser.avatar.length === 2) {
            avatarElement.textContent = currentUser.avatar;
        } else {
            const initials = (currentUser.displayName || currentUser.username)
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
            avatarElement.textContent = initials;
        }
        const now = new Date();
        document.getElementById('preview-date').textContent = now.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

function showReviewStep(step) {
    document.querySelectorAll('.review-step').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.step-number').forEach(el => el.classList.remove('active'));
    document.getElementById(`step-${step}`).classList.add('active');
    document.querySelector(`.step-number[data-step="${step}"]`).classList.add('active');
    currentReviewStep = step;
    if (step === 3) updatePreview();
}

function nextReviewStep(step) {
    if (currentReviewStep === 1 && !selectedTitle) {
        alert('Please select a title to review');
        return;
    }
    if (currentReviewStep === 2 && reviewData.rating === 0) {
        alert('Please give a rating');
        return;
    }
    showReviewStep(step);
}

function prevReviewStep(step) {
    showReviewStep(step);
}

function checkURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const titleId = urlParams.get('id');
    const titleType = urlParams.get('type');
    
    if (titleId && titleType) {
        loadAndSelectTitle(titleId, titleType);
    }
}

async function loadAndSelectTitle(id, type) {
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        let allTitles = [...(data.movies || []), ...(data.anime || [])];
        const db = JSON.parse(localStorage.getItem('movani_db') || '{}');
        const localTitles = [...(db.moviesData || []), ...(db.animeData || [])];
        allTitles = [...allTitles, ...localTitles];
        const title = allTitles.find(t => t.id == id && t.type === type);
        if (title) {
            selectTitle(title);
            setTimeout(() => nextReviewStep(2), 500);
        }
    } catch (error) {
        console.error('Error loading title:', error);
    }
}

function initSearchFunctionality() {
    const searchInput = document.getElementById('title-search');
    const searchBtn = document.getElementById('search-btn');
    const typeFilter = document.getElementById('type-filter');
    const yearFilter = document.getElementById('year-filter');
    
    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            performSearch(this.value, typeFilter.value, yearFilter.value);
        }, 500);
    });
    
    searchBtn.addEventListener('click', () => {
        performSearch(searchInput.value, typeFilter.value, yearFilter.value);
    });
    
    typeFilter.addEventListener('change', () => {
        performSearch(searchInput.value, typeFilter.value, yearFilter.value);
    });
    
    yearFilter.addEventListener('change', () => {
        performSearch(searchInput.value, typeFilter.value, yearFilter.value);
    });
}

async function performSearch(query, type, year) {
    const resultsContainer = document.getElementById('search-results');
    
    if (!query.trim()) {
        resultsContainer.innerHTML = '<div class="no-results">Start typing to search for titles</div>';
        return;
    }
    
    resultsContainer.innerHTML = '<div class="loading">Searching...</div>';
    
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        let allTitles = [...(data.movies || []), ...(data.anime || [])];
        const db = JSON.parse(localStorage.getItem('movani_db') || '{}');
        const localTitles = [...(db.moviesData || []), ...(db.animeData || [])];
        allTitles = [...allTitles, ...localTitles];
        
        let results = allTitles.filter(title => {
            const matchesText = title.title.toLowerCase().includes(query.toLowerCase()) ||
                              title.genres?.some(genre => genre.toLowerCase().includes(query.toLowerCase()));
            const matchesType = type === 'all' || title.type === type;
            const matchesYear = year === 'all' || title.year == year;
            return matchesText && matchesType && matchesYear;
        });
        
        if (results.length === 0) {
            resultsContainer.innerHTML = '<div class="no-results">No titles found. Try different keywords.</div>';
        } else {
            resultsContainer.innerHTML = results.map(title => `
                <div class="result-item" data-id="${title.id}" data-type="${title.type}">
                    <div class="result-poster">
                        <img src="${title.poster || 'https://via.placeholder.com/60x90?text=No+Image'}" 
                             alt="${title.title}">
                    </div>
                    <div class="result-info">
                        <div class="result-title">${title.title}</div>
                        <div class="result-meta">
                            <span>${title.year || 'N/A'}</span>
                            <span>${title.type === 'movie' ? (title.runtime || 'N/A') : (title.episodes ? `${title.episodes} episodes` : 'N/A')}</span>
                            <span class="result-type">${title.type.toUpperCase()}</span>
                        </div>
                    </div>
                </div>
            `).join('');
            
            document.querySelectorAll('.result-item').forEach(item => {
                item.addEventListener('click', function() {
                    document.querySelectorAll('.result-item').forEach(el => el.classList.remove('selected'));
                    this.classList.add('selected');
                    const titleId = parseInt(this.dataset.id);
                    const titleType = this.dataset.type;
                    const title = results.find(t => t.id === titleId && t.type === titleType);
                    selectTitle(title);
                });
            });
        }
    } catch (error) {
        console.error('Error searching:', error);
        resultsContainer.innerHTML = '<div class="no-results">Error loading search results</div>';
    }
}

function selectTitle(title) {
    selectedTitle = title;
    reviewData.titleId = title.id;
    const previewContainer = document.getElementById('selected-title-preview');
    previewContainer.innerHTML = `
        <div class="selected-poster">
            <img src="${title.poster || 'https://via.placeholder.com/80x120?text=No+Image'}" 
                 alt="${title.title}">
        </div>
        <div class="selected-info">
            <h4>${title.title}</h4>
            <div class="selected-meta">
                <span>${title.year || 'N/A'}</span>
                <span>${title.type.toUpperCase()}</span>
                <span>${title.genres?.slice(0, 2).join(', ') || ''}</span>
            </div>
        </div>
    `;
    document.querySelector('.next-step-btn').disabled = false;
}

async function loadRecentWatched() {
    const container = document.getElementById('recent-watched');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) return;
    
    try {
        const response = await fetch('data.json');
        const data = await response.json();
        const db = JSON.parse(localStorage.getItem('movani_db') || '{}');
        const watchlist = db.watchlist?.filter(w => w.userId === currentUser.id) || [];
        let allTitles = [...(data.movies || []), ...(data.anime || [])];
        const recentTitles = watchlist
            .map(w => allTitles.find(t => t.id === w.itemId))
            .filter(t => t)
            .slice(0, 6);
        
        if (recentTitles.length > 0) {
            container.innerHTML = recentTitles.map(title => `
                <div class="quick-item" onclick="selectTitle(${JSON.stringify(title).replace(/"/g, '&quot;')})">
                    <div class="quick-poster">
                        <img src="${title.poster || 'https://via.placeholder.com/150x120?text=No+Image'}" 
                             alt="${title.title}">
                    </div>
                    <div class="quick-title">${title.title}</div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<div class="no-recent">No recently watched titles found</div>';
        }
    } catch (error) {
        console.error('Error loading recent watched:', error);
    }
}

function initRatingSystem() {
    const stars = document.querySelectorAll('#stars-container i');
    const ratingValue = document.getElementById('rating-value');
    
    stars.forEach(star => {
        star.addEventListener('mouseover', function() {
            const value = parseInt(this.dataset.value);
            highlightStars(value);
        });
        
        star.addEventListener('mouseout', () => {
            highlightStars(reviewData.rating);
        });
        
        star.addEventListener('click', function() {
            const value = parseInt(this.dataset.value);
            reviewData.rating = value;
            ratingValue.textContent = value;
            highlightStars(value);
        });
    });
}

function highlightStars(value) {
    const stars = document.querySelectorAll('#stars-container i');
    stars.forEach(star => {
        const starValue = parseInt(star.dataset.value);
        star.classList.toggle('active', starValue <= value);
    });
}

function initEditor() {
    const editorBtns = document.querySelectorAll('.editor-btn');
    const reviewContent = document.getElementById('review-content');
    
    editorBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const command = this.dataset.command;
            if (command === 'createlink') {
                const url = prompt('Enter the URL:');
                if (url) document.execCommand(command, false, url);
            } else {
                document.execCommand(command, false, null);
            }
        });
    });
    
    reviewContent.addEventListener('input', function() {
        reviewData.content = this.value;
    });
    
    document.getElementById('review-title').addEventListener('input', function() {
        reviewData.reviewTitle = this.value;
    });
    
    document.getElementById('spoiler-checkbox').addEventListener('change', function() {
        reviewData.spoiler = this.checked;
    });
    
    document.querySelectorAll('input[name="privacy"]').forEach(radio => {
        radio.addEventListener('change', function() {
            reviewData.privacy = this.value;
        });
    });
}

function initMetricSliders() {
    const overallSlider = document.getElementById('overall-score');
    const overallValue = document.getElementById('overall-value');
    
    overallSlider.addEventListener('input', function() {
        const value = parseFloat(this.value);
        reviewData.metrics.overall = value;
        overallValue.textContent = value.toFixed(1);
    });
    
    document.querySelectorAll('.metric-slider').forEach(slider => {
        const valueDisplay = slider.nextElementSibling;
        slider.addEventListener('input', function() {
            const value = parseFloat(this.value);
            const metric = this.dataset.metric;
            reviewData.metrics[metric] = value;
            valueDisplay.textContent = value.toFixed(1);
        });
    });
}

function initStepNavigation() {
    const nextStep1Btn = document.querySelector('#step-1 .next-step-btn');
    nextStep1Btn.disabled = true;
    
    document.addEventListener('click', function(e) {
        if (e.target.closest('.result-item') || e.target.closest('.quick-item')) {
            nextStep1Btn.disabled = false;
        }
    });
}

function initFormSubmission() {
    const submitBtn = document.getElementById('submit-review-btn');
    submitBtn.addEventListener('click', function() {
        if (!validateReview()) return;
        submitReview();
    });
}

function validateReview() {
    if (!reviewData.titleId) {
        alert('Please select a title to review');
        return false;
    }
    
    if (reviewData.rating === 0) {
        alert('Please give a rating');
        return false;
    }
    
    if (!reviewData.content.trim()) {
        alert('Please write your review content');
        return false;
    }
    
    return true;
}

function submitReview() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('Please login to submit a review');
        return;
    }
    
    const db = JSON.parse(localStorage.getItem('movani_db') || '{}');
    
    const newReview = {
        id: Date.now(),
        userId: currentUser.id,
        movieId: reviewData.titleId,
        user: currentUser.displayName || currentUser.username,
        avatar: currentUser.avatar || (currentUser.displayName || currentUser.username).substring(0, 2).toUpperCase(),
        rating: reviewData.rating,
        title: reviewData.reviewTitle || `Review of ${selectedTitle.title}`,
        content: reviewData.content,
        metrics: reviewData.metrics,
        spoiler: reviewData.spoiler,
        privacy: reviewData.privacy,
        date: new Date().toISOString().split('T')[0],
        likes: 0,
        comments: []
    };
    
    if (!db.reviews) db.reviews = [];
    db.reviews.push(newReview);
    
    const userIndex = db.users.findIndex(u => u.id === currentUser.id);
    if (userIndex !== -1) {
        if (!db.users[userIndex].stats) db.users[userIndex].stats = {};
        if (!db.users[userIndex].stats.reviews) db.users[userIndex].stats.reviews = 0;
        db.users[userIndex].stats.reviews++;
    }
    
    localStorage.setItem('movani_db', JSON.stringify(db));
    showSuccessModal();
}

function updatePreview() {
    if (!selectedTitle) return;
    
    document.getElementById('preview-title').textContent = selectedTitle.title;
    document.getElementById('preview-type').textContent = selectedTitle.type.toUpperCase();
    document.getElementById('preview-year').textContent = selectedTitle.year || 'N/A';
    document.getElementById('preview-rating').textContent = reviewData.rating;
    document.getElementById('preview-review-title').textContent = 
        reviewData.reviewTitle || `Review of ${selectedTitle.title}`;
    document.getElementById('preview-review-content').textContent = reviewData.content;
    
    const metrics = reviewData.metrics;
    document.getElementById('preview-story').style.width = `${metrics.story * 10}%`;
    document.getElementById('preview-characters').style.width = `${metrics.characters * 10}%`;
    document.getElementById('preview-visuals').style.width = `${metrics.visuals * 10}%`;
    document.getElementById('preview-sound').style.width = `${metrics.sound * 10}%`;
    
    document.getElementById('preview-story-score').textContent = metrics.story.toFixed(1);
    document.getElementById('preview-characters-score').textContent = metrics.characters.toFixed(1);
    document.getElementById('preview-visuals-score').textContent = metrics.visuals.toFixed(1);
    document.getElementById('preview-sound-score').textContent = metrics.sound.toFixed(1);
    
    const spoilerElement = document.getElementById('preview-spoiler');
    spoilerElement.style.display = reviewData.spoiler ? 'flex' : 'none';
}

function showSuccessModal() {
    const modal = document.getElementById('success-modal');
    modal.style.display = 'flex';
}

function viewReview() {
    window.location.href = `details.html?id=${selectedTitle.id}&type=${selectedTitle.type}`;
}

function writeAnotherReview() {
    selectedTitle = null;
    reviewData = {
        titleId: null,
        rating: 0,
        reviewTitle: '',
        content: '',
        metrics: {
            overall: 5,
            story: 5,
            characters: 5,
            visuals: 5,
            sound: 5
        },
        spoiler: false,
        privacy: 'public'
    };
    
    document.getElementById('selected-title-preview').innerHTML = '';
    document.getElementById('review-title').value = '';
    document.getElementById('review-content').value = '';
    document.getElementById('rating-value').textContent = '0';
    document.getElementById('overall-value').textContent = '5.0';
    document.querySelectorAll('.metric-value').forEach(el => el.textContent = '5.0');
    document.querySelectorAll('.metric-slider').forEach(slider => slider.value = 5);
    document.getElementById('spoiler-checkbox').checked = false;
    
    showReviewStep(1);
    document.getElementById('success-modal').style.display = 'none';
}

function goHome() {
    window.location.href = 'index.html';
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'login.html';
}