document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = parseInt(urlParams.get('id'));
    const type = urlParams.get('type');
    
    if (!id) {
        window.location.href = 'index.html';
        return;
    }
    
    const data = await loadJSON();
    if (!data) return;
    
    const items = type === 'movie' ? data.movies : data.anime;
    const item = items.find(i => i.id === id);
    
    if (!item) {
        window.location.href = 'index.html';
        return;
    }
    
    populateDetails(item);
    loadReviewsForItem(item.id, data);
    loadSimilarItems(item, data);
    initStarRating();
    initTrailerModal(item);
    initTabs();
    checkAuthStatus();
});

async function loadJSON() {
    try {
        const response = await fetch('data.json');
        return await response.json();
    } catch (error) {
        console.error('Error loading JSON:', error);
        return null;
    }
}

function populateDetails(item) {
    document.getElementById('detail-title').textContent = item.title;
    document.getElementById('detail-poster').src = item.poster;
    document.getElementById('detail-poster').alt = item.title;
    document.getElementById('main-rating').textContent = item.rating;
    document.getElementById('detail-year').textContent = item.year;
    document.getElementById('detail-synopsis').textContent = item.synopsis;
    
    const typeBadge = document.getElementById('type-badge');
    typeBadge.textContent = item.type.toUpperCase();
    typeBadge.className = `type-badge ${item.type}`;
    
    const runtimeElement = document.getElementById('detail-runtime');
    if (item.type === 'movie') {
        runtimeElement.textContent = item.runtime;
    } else {
        runtimeElement.textContent = `${item.episodes} Episodes`;
    }
    
    document.getElementById('detail-status').textContent = item.status;
    
    const genresContainer = document.getElementById('genres');
    genresContainer.innerHTML = item.genres.map(genre => 
        `<span class="genre-tag">${genre}</span>`
    ).join('');
    
    const starsContainer = document.getElementById('stars');
    const fullStars = Math.floor(item.rating / 2);
    starsContainer.innerHTML = Array(5).fill(0).map((_, i) => 
        `<i class="fas fa-star ${i < fullStars ? 'active' : ''}"></i>`
    ).join('');
    
    const crewContainer = document.getElementById('crew-grid');
    if (item.director) {
        crewContainer.innerHTML += `
            <div class="crew-card">
                <h4>${item.director}</h4>
                <p class="crew-role">Director</p>
            </div>
        `;
    }
    if (item.studio) {
        crewContainer.innerHTML += `
            <div class="crew-card">
                <h4>${item.studio}</h4>
                <p class="crew-role">Studio</p>
            </div>
        `;
    }
    
    const reviewBtn = document.getElementById('write-review-btn');
    if (reviewBtn) {
        reviewBtn.href = `add-review.html?id=${item.id}&type=${item.type}`;
    }
}

function loadReviewsForItem(itemId, data) {
    const container = document.getElementById('user-reviews');
    const reviews = data.reviews.filter(r => r.movieId === itemId);
    
    container.innerHTML = reviews.map(review => `
        <div class="review-card">
            <div class="review-header">
                <div class="review-user-info">
                    <div class="review-avatar">${review.avatar}</div>
                    <div class="review-meta">
                        <h4>${review.user}</h4>
                        <span class="review-date">${review.date}</span>
                    </div>
                </div>
                <div class="review-rating">${review.rating}/10</div>
            </div>
            <p class="review-content">${review.content}</p>
            <div class="review-actions">
                <button class="review-action-btn">
                    <i class="fas fa-thumbs-up"></i> ${review.likes}
                </button>
                <button class="review-action-btn">
                    <i class="fas fa-comment"></i> Reply
                </button>
            </div>
        </div>
    `).join('');
}

function loadSimilarItems(item, data) {
    const container = document.getElementById('similar-content');
    const allItems = [...data.movies, ...data.anime];
    const similarItems = allItems
        .filter(i => i.id !== item.id && i.type === item.type)
        .sort((a, b) => {
            const aSimilarity = calculateSimilarity(item, a);
            const bSimilarity = calculateSimilarity(item, b);
            return bSimilarity - aSimilarity;
        })
        .slice(0, 6);
    
    container.innerHTML = similarItems.map(similarItem => createMovieCard(similarItem)).join('');
}

function calculateSimilarity(item1, item2) {
    const sharedGenres = item1.genres.filter(genre => item2.genres.includes(genre)).length;
    const yearDiff = Math.abs(item1.year - item2.year);
    const yearScore = Math.max(0, 10 - yearDiff / 2);
    return sharedGenres * 2 + yearScore;
}

function createMovieCard(item) {
    return `
        <div class="movie-card" data-id="${item.id}" data-type="${item.type}">
            <div class="movie-poster-container">
                <img src="${item.poster}" alt="${item.title}" class="movie-poster" loading="lazy">
                <span class="movie-type ${item.type}">${item.type.toUpperCase()}</span>
            </div>
            <div class="movie-info">
                <h3 class="movie-title">${item.title}</h3>
                <div class="movie-meta">
                    <span>${item.year}</span>
                    <div class="movie-rating">
                        <i class="fas fa-star"></i>
                        <span class="rating-value">${item.rating}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function initStarRating() {
    const stars = document.querySelectorAll('.star-rating i');
    const ratingValue = document.querySelector('.rating-value');
    
    stars.forEach(star => {
        star.addEventListener('mouseover', function() {
            const rating = parseInt(this.dataset.rating);
            highlightStars(rating);
        });
        
        star.addEventListener('mouseout', () => {
            highlightStars(0);
        });
        
        star.addEventListener('click', function() {
            const rating = parseInt(this.dataset.rating);
            ratingValue.textContent = `${rating}/10`;
        });
    });
}

function highlightStars(rating) {
    const stars = document.querySelectorAll('.star-rating i');
    stars.forEach(star => {
        const starRating = parseInt(star.dataset.rating);
        star.classList.toggle('active', starRating <= rating);
    });
}

function initTrailerModal(item) {
    const modal = document.getElementById('trailer-modal');
    const trailerBtn = document.getElementById('trailer-btn');
    const closeBtn = document.querySelector('.close-modal');
    const videoFrame = document.getElementById('trailer-video');
    
    if (!item.trailer) {
        trailerBtn.style.display = 'none';
        return;
    }
    
    trailerBtn.addEventListener('click', () => {
        videoFrame.src = item.trailer;
        modal.style.display = 'flex';
    });
    
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
        videoFrame.src = '';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            videoFrame.src = '';
        }
    });
}

function initTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabName}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });
}

function checkAuthStatus() {
    const currentUser = localStorage.getItem('currentUser');
    const usernameElement = document.getElementById('username');
    
    if (currentUser && usernameElement) {
        const user = JSON.parse(currentUser);
        usernameElement.textContent = user.displayName || user.username;
    }
}

function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}