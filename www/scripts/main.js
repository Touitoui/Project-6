let api_address = "http://localhost:8000/api/v1/"
const MOBILE_CARDS = 2;
const TABLET_CARDS = 4;
const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

async function getMovieById(id) {
    console.log(api_address + "titles/" + id)
    const res = await fetch(api_address + "titles/" + id)
    return await res.json();
}

async function getBest() {
    const res = await fetch(api_address + "titles/?sort_by=-imdb_score")
    let bestList = await res.json();
    return await getMovieById(bestList.results[0].id)
}

async function getBestByGenre(genre) {
    const res = await fetch(api_address + "titles/?sort_by=-imdb_score&genre=" + genre)
    let bestList = await res.json();
    let movie_list = [...bestList.results]
    if (bestList.next) {
        const res2 = await fetch(bestList.next)
        let bestList2 = await res2.json();
        movie_list.push(bestList2.results[0])
    }
    // console.log(bestList.results)
    // console.log(bestList2.results)

    let results = []
    for (let i = 0; i < movie_list.length; i++)
        results.push(await getMovieById(movie_list[i].id))
    // console.log(results)

    return results
}

async function getGenres() {
    let next = api_address + "genres/"
    let genres = [];
    console.log("Genre calls:")
    while (next) {
        const res = await fetch(next)
        let json = await res.json();
        console.log(json.results)
        next = json.next
        genres.push([...json.results])
    }
    genres = genres.flat(1)
    console.log("Genres:")
    console.log(genres)
    return genres
}

async function createDropdown(genres) {
    // Get and clone the template
    const template = document.getElementById('dropdown-section-template');
    const dropdownSection = template.content.cloneNode(true);

    const dropdownButton = dropdownSection.querySelector('.dropdown-toggle');
    const dropdownMenu = dropdownSection.querySelector('.dropdown-menu');
    const movieBlock = dropdownSection.querySelector('#dropdown-movie-block');

    // Populate dropdown with genres
    genres.forEach(genre => {
        const menuItem = document.createElement('li');
        const genreLink = document.createElement('a');
        genreLink.classList.add('dropdown-item');
        genreLink.href = '#';
        genreLink.textContent = genre.name;
        genreLink.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            updateMovieSection(genre.name, dropdownButton);
        });
        menuItem.appendChild(genreLink);
        dropdownMenu.appendChild(menuItem);
    });

    document.body.appendChild(dropdownSection);

    // Update with first genre initially
    if (genres.length > 0) {
        await updateMovieSection(genres[0].name, dropdownButton);
    }
}

async function createMovieCard(movie) {
    // Get the template
    const template = document.getElementById('movie-card-template');
    // Clone the template content
    const movieCard = template.content.cloneNode(true);

    // Update the card content
    const img = movieCard.querySelector('.card-img');
    img.src = movie.image_url;
    img.alt = movie.original_title;
    img.addEventListener("error", () => {
        img.src = "images/404.jpg";
    });

    const title = movieCard.querySelector('.card-title');
    title.textContent = movie.original_title;
    title.title = movie.original_title; // For tooltip

    const detailsButton = movieCard.querySelector('.btn');
    detailsButton.addEventListener('click', () => {
        openModal(movie.id);
    });

    return movieCard;
}

async function updateMovieSection(genre, dropdownButton) {
    const movieBlock = document.getElementById('dropdown-movie-block');
    movieBlock.innerHTML = '';
    movieBlock.classList.add('row', 'row-cols-1', 'row-cols-md-2', 'row-cols-lg-3', 'g-4');

    if (dropdownButton) {
        dropdownButton.textContent = genre;
    }

    try {
        const bestList = await getBestByGenre(genre);
        for (const movie of bestList) {
            const movieCard = await createMovieCard(movie);
            movieBlock.appendChild(movieCard);
        }
    } catch (error) {
        console.error('Error updating movie section:', error);
    }
}

async function createBestMovieSection() {
    let best = await getBest();

    // Get and clone the template
    const template = document.getElementById('best-movie-section-template');
    const bestMovieSection = template.content.cloneNode(true);

    // Update content
    const img = bestMovieSection.querySelector('img');
    img.src = best.image_url;
    img.alt = best.original_title;
    img.addEventListener("error", () => {
        img.src = "images/404.jpg";
    });

    const title = bestMovieSection.querySelector('h3');
    title.textContent = best.original_title;

    const description = bestMovieSection.querySelector('.description');
    description.textContent = best.description;

    const button = bestMovieSection.querySelector('button');
    button.addEventListener('click', () => {
        openModal(best.id);
    });

    document.body.appendChild(bestMovieSection);
}

async function createMovieCategory(genre) {
    let bestList = await getBestByGenre(genre);

    // Get and clone the template
    const template = document.getElementById('category-section-template');
    const categorySection = template.content.cloneNode(true);

    // Set category title
    categorySection.querySelector('h2').textContent = genre;

    // Get the movie container
    const movieContainer = categorySection.querySelector('.row-cols-1');

    // Add movies
    const updateVisibleCards = async () => {
        movieContainer.innerHTML = '';
        let displayCount;

        if (window.innerWidth < MOBILE_BREAKPOINT) {
            displayCount = MOBILE_CARDS;
        } else if (window.innerWidth < TABLET_BREAKPOINT) {
            displayCount = TABLET_CARDS;
        } else {
            displayCount = bestList.length;
        }

        // Create initial cards
        for (let i = 0; i < Math.min(displayCount, bestList.length); i++) {
            const movieCard = await createMovieCard(bestList[i]);
            movieContainer.appendChild(movieCard);
        }

        // Add "See more" button if needed
        if (window.innerWidth < TABLET_BREAKPOINT && bestList.length > displayCount) {
            const buttonCol = document.createElement('div');
            buttonCol.classList.add('col-12', 'text-center', 'mt-4');

            const seeMoreBtn = document.createElement('button');
            seeMoreBtn.classList.add('btn', 'btn-primary');
            seeMoreBtn.textContent = 'Voir plus';
            seeMoreBtn.addEventListener('click', async () => {
                buttonCol.remove();
                for (let i = displayCount; i < bestList.length; i++) {
                    const movieCard = await createMovieCard(bestList[i]);
                    movieContainer.appendChild(movieCard);
                }
            });

            buttonCol.appendChild(seeMoreBtn);
            movieContainer.appendChild(buttonCol);
        }
    };

    await updateVisibleCards();

    const debouncedUpdate = debounce(updateVisibleCards, 250);
    window.addEventListener('resize', debouncedUpdate);

    document.body.appendChild(categorySection);
}

// Utility function to debounce resize events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

async function setCategories(){
    await createMovieCategory("Action");
    await createMovieCategory("Drama");
    await createMovieCategory("News");
}

// Modal functionality
async function createModal() {
    // Check if modal already exists
    if (document.getElementById('movieModal')) {
        return; // Modal already exists
    }

    // Get the template
    const template = document.getElementById('movie-modal-template');
    // Clone the template content
    const modal = template.content.cloneNode(true);

    // Add close button functionality
    const closeButton = modal.querySelector('.modal-close');
    closeButton.onclick = closeModal;

    // Append to body
    document.body.appendChild(modal);
}

async function openModal(movie_id) {
    let movie = await getMovieById(movie_id);
    const modal = document.getElementById('movieModal');

    // Update image
    const modalImage = document.getElementById('modal-movie-image');
    modalImage.src = movie.image_url;
    modalImage.alt = movie.original_title;
    modalImage.addEventListener("error", () => {
        modalImage.src = "images/404.jpg";
    });

    // Update title
    let titleText = movie.title;
    if (movie.title !== movie.original_title) {
        titleText += ` (${movie.original_title})`;
    }
    document.getElementById('modal-movie-title').textContent = titleText;

    // Update other fields
    document.getElementById('modal-movie-release-date').textContent = movie.year;
    document.getElementById('modal-movie-genres').textContent = movie.genres;
    document.getElementById('modal-movie-rating').textContent = movie.rated;
    document.getElementById('modal-movie-duration').textContent = `${movie.duration} minutes`;
    document.getElementById('modal-movie-country').textContent = movie.countries;
    document.getElementById('modal-movie-score').textContent = `IMDB score: ${movie.imdb_score}/10`;
    document.getElementById('modal-movie-director').textContent = `Réalisé par: ${movie.director}`;
    document.getElementById('modal-movie-description').textContent = movie.long_description;
    document.getElementById('modal-movie-actors').textContent = `Avec: ${movie.actors}`;
    document.getElementById('modal-movie-box-office').textContent = `${movie.budget} ${movie.budget_currency}`;

    // Display modal
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('movieModal');
    modal.style.display = 'none';
}

// Main initialization
async function init() {
    await createBestMovieSection(); // Replace setBest() with this
    // await setBest();
    await setCategories();
    const genres = await getGenres();
    await createDropdown(genres);

    await createModal();

    // Add event listeners to details buttons
    // await enhanceDetailsButtons();

    // Add global click event to close modal when clicking outside
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('movieModal');
        if (event.target === modal) {
            closeModal();
        }
    });
}

// Run initialization
document.addEventListener('DOMContentLoaded', function() {
    init();
});
