document.addEventListener('DOMContentLoaded', function() {
    loadWatchlist();
    initFilters();
});

async function loadWatchlist() {
    const container = document.getElementById('watchlist-content');
    const emptyState = document.getElementById('empty-watchlist');
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!currentUser) {
        emptyState.style.display = 'block';
        container.style.display = 'none';
        return;
    }
    
    const db = JSON.parse(localStorage.getItem('movani_db') || '{}');
    const watchlistItems = db.watchlist?.filter(w => w.userId === currentUser.id) || [];
    
    if (watchlistItems.length === 0) {
        emptyState.style.display = 'block';
        container.style.display = 'none';
        updateStats([]);
        return;
    }
    
    const jsonData = await loadJSON();
    const allItems = [...(jsonData?.movies || []), ...(jsonData?.anime || [])];
    const localItems = [...(db.moviesData || []), ...(db.animeData || [])];
    allItems.push(...localItems);
    
    const itemsWithDetails = watchlistItems.map(watchlistItem => {
        const details = allItems.find(item => 
            item.id === watchlistItem.itemId && 
            (item.type === watchlistItem.itemType || !item.type)
        );
        
        return {
            ...watchlistItem,
            details: details || {
                title: 'Unknown Title',
                type: watchlistItem.itemType,
                rating: 0,
                year: 'N/A'
            }
        };
    }).filter(item => item.details);
    
    updateStats(itemsWithDetails);
    container.innerHTML = itemsWithDetails.map(item => createWatchlistCard(item)).join('');
    emptyState.style.display = 'none';
    container.style.display = 'grid';
}

async function loadJSON() {
    try {
        const response = await fetch('data.json');
        return await response.json();
    } catch (error) {
        console.error('Error loading JSON:', error);
        return null;
    }
}

function createWatchlistCard(item) {
    const details = item.details;
    
    return `
        <div class="movie-card watchlist-card" data-id="${item.itemId}" data-type="${details.type}">
            <div class="movie-poster-container">
                <img src="${details.poster || 'https://via.placeholder.com/200x300?text=No+Image'}" 
                     alt="${details.title}" class="movie-poster" loading="lazy">
                <span class="movie-type ${details.type}">${details.type?.toUpperCase() || 'N/A'}</span>
                <div class="watchlist-actions">
                    <button class="action-btn remove-btn" data-id="${item.id}">
                        <i class="fas fa-times"></i>
                    </button>
                    <button class="action-btn status-btn" data-id="${item.id}">
                        <i class="fas fa-check"></i>
                    </button>
                </div>
            </div>
            <div class="movie-info">
                <h3 class="movie-title">${details.title}</h3>
                <div class="movie-meta">
                    <span>${details.year || 'N/A'}</span>
                    <div class="movie-rating">
                        <i class="fas fa-star"></i>
                        <span class="rating-value">${details.rating || 'N/A'}</span>
                    </div>
                </div>
                <div class="watchlist-status">
                    <select class="status-select" data-id="${item.id}">
                        <option value="unwatched">Unwatched</option>
                        <option value="watching">Watching</option>
                        <option value="completed">Completed</option>
                        <option value="dropped">Dropped</option>
                    </select>
                </div>
            </div>
        </div>
    `;
}

function updateStats(items) {
    document.getElementById('total-count').textContent = items.length;
    
    const totalHours = items.reduce((total, item) => {
        if (item.details.runtime) {
            const match = item.details.runtime.match(/(\d+)/);
            if (match) return total + parseInt(match[1]) / 60;
        }
        return total + 2;
    }, 0);
    
    document.getElementById('total-time').textContent = Math.round(totalHours);
    
    const validRatings = items.filter(item => item.details.rating > 0);
    if (validRatings.length > 0) {
        const avgRating = validRatings.reduce((sum, item) => sum + item.details.rating, 0) / validRatings.length;
        document.getElementById('avg-rating').textContent = avgRating.toFixed(1);
    } else {
        document.getElementById('avg-rating').textContent = '0';
    }
}

function initFilters() {
    const sortSelect = document.getElementById('watchlist-sort');
    const filterSelect = document.getElementById('watchlist-filter');
    const statusSelect = document.getElementById('watchlist-status');
    
    if (sortSelect && filterSelect && statusSelect) {
        [sortSelect, filterSelect, statusSelect].forEach(select => {
            select.addEventListener('change', loadWatchlist);
        });
    }
    
    document.addEventListener('click', function(e) {
        if (e.target.closest('.remove-btn')) {
            const itemId = e.target.closest('.remove-btn').dataset.id;
            removeFromWatchlist(itemId);
        }
    });
}

function removeFromWatchlist(watchlistItemId) {
    const db = JSON.parse(localStorage.getItem('movani_db') || '{}');
    const initialLength = db.watchlist?.length || 0;
    
    db.watchlist = db.watchlist?.filter(w => w.id !== parseInt(watchlistItemId)) || [];
    
    if (db.watchlist.length < initialLength) {
        localStorage.setItem('movani_db', JSON.stringify(db));
        loadWatchlist();
        alert('Removed from watchlist');
    }
}