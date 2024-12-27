let api_address = "http://localhost:8000/api/v1/"
const DISPLAY_COUNTS = {
    mobile: 2,
    tablet: 4,
    default: Number.POSITIVE_INFINITY
};
const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

//Call to the API, get all data of a movie by its ID
async function getMovieById(id) {
    console.log(api_address + "titles/" + id)
    const res = await fetch(api_address + "titles/" + id)
    return await res.json();
}

//Call to the API, get the best movie
async function getBest() {
    const res = await fetch(api_address + "titles/?sort_by=-imdb_score")
    let bestList = await res.json();
    return await getMovieById(bestList.results[0].id)
}

//Call to the API, get the 6 best movies of a given genre
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

//Call to the API, get all genres
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

//Function to create the movie cards
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

    const cardContainer = movieCard.querySelector('.card-img-container');
    cardContainer.style.cursor = 'pointer'; // Add pointer cursor to indicate clickability
    cardContainer.addEventListener('click', (event) => {
        // Only open modal if we didn't click the details button
        if (!event.target.classList.contains('btn')) {
            openModal(movie.id);
        }
    });

    // Keep the separate details button functionality
    const detailsButton = movieCard.querySelector('.btn');
    detailsButton.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent card click event from triggering
        openModal(movie.id);
    });

    return movieCard;
}

async function createBestMovieSection() {
    let best = await getBest();

    // Get and clone the template
    const template = document.getElementById('best-movie-section-template');
    const bestMovieSection = template.content.cloneNode(true);

    // Update content
    const imgContainer = bestMovieSection.querySelector('.col-12.col-md-4');
    const img = imgContainer.querySelector('img');

    // Add styles to make the image container clickable
    imgContainer.style.cursor = 'pointer';

    // Set image properties
    img.src = best.image_url;
    img.alt = best.original_title;
    img.addEventListener("error", () => {
        img.src = "images/404.jpg";
    });

    // Add click event to the image container
    imgContainer.addEventListener('click', () => {
        openModal(best.id);
    });

    const title = bestMovieSection.querySelector('h3');
    title.textContent = best.original_title;

    const description = bestMovieSection.querySelector('.description');
    description.textContent = best.description;

    // Keep the separate details button functionality
    const button = bestMovieSection.querySelector('button');
    button.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent container click event from triggering
        openModal(best.id);
    });

    document.body.appendChild(bestMovieSection);
}

// Function to create and setup the toggle button
function createToggleButton(isExpanded, onClick) {
    const buttonCol = document.createElement('div');
    buttonCol.classList.add('col-12', 'text-center', 'mt-4');

    const toggleBtn = document.createElement('button');
    toggleBtn.classList.add('btn', 'btn-primary');
    toggleBtn.textContent = isExpanded ? 'Voir moins' : 'Voir plus';
    toggleBtn.addEventListener('click', onClick);

    buttonCol.appendChild(toggleBtn);
    return buttonCol;
}

// Function to determine how many cards to display
function getDisplayCount(windowWidth) {
    if (windowWidth < MOBILE_BREAKPOINT) return DISPLAY_COUNTS.mobile;
    if (windowWidth < TABLET_BREAKPOINT) return DISPLAY_COUNTS.tablet;
    return DISPLAY_COUNTS.default;
}

// Function to create genre dropdown items
async function setupGenreDropdown(dropdownMenu, dropdownButton, updateMovies) {
    const genres = await getGenres();

    genres.forEach(genreItem => {
        const menuItem = document.createElement('li');
        const genreLink = document.createElement('a');
        genreLink.classList.add('dropdown-item');
        genreLink.href = '#';
        genreLink.textContent = genreItem.name;

        genreLink.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();
            dropdownButton.textContent = genreItem.name;
            await updateMovies(genreItem.name);
        });

        menuItem.appendChild(genreLink);
        dropdownMenu.appendChild(menuItem);
    });

    // Set initial genre
    if (genres.length > 0) {
        dropdownButton.textContent = genres[0].name;
    }
}

// Main function to render movie cards
async function renderMovieCards(movieContainer, movies, isExpanded) {
    movieContainer.innerHTML = '';
    const displayCount = getDisplayCount(window.innerWidth);
    const cardsToShow = isExpanded ? movies.length : Math.min(displayCount, movies.length);

    // Create and append movie cards
    for (let i = 0; i < cardsToShow; i++) {
        const movieCard = await createMovieCard(movies[i]);
        movieContainer.appendChild(movieCard);
    }

    // Add toggle button if needed
    if (window.innerWidth < TABLET_BREAKPOINT && movies.length > displayCount) {
        const toggleButton = createToggleButton(isExpanded, async () => {
            movieContainer.dataset.expanded = (!isExpanded).toString();
            await renderMovieCards(movieContainer, movies, !isExpanded);
        });
        movieContainer.appendChild(toggleButton);
    }

    movieContainer.dataset.expanded = isExpanded.toString();
}

// Main category section creation function
async function createCategorySection(genre, isDynamic = false) {
    let movies = await getBestByGenre(genre);

    // Clone appropriate template
    const templateId = isDynamic ? 'dropdown-section-template' : 'category-section-template';
    const template = document.getElementById(templateId);
    const categorySection = template.content.cloneNode(true);

    // Setup basic section structure
    const title = categorySection.querySelector('h2');
    title.textContent = isDynamic ? 'Autre' : genre;

    const movieContainer = categorySection.querySelector('.row-cols-1');
    if (isDynamic) {
        movieContainer.id = 'dropdown-movie-block';

        // Setup dropdown for dynamic section
        const dropdownButton = categorySection.querySelector('.dropdown-toggle');
        const dropdownMenu = categorySection.querySelector('.dropdown-menu');

        const updateMovies = async (newGenre) => {
            movies = await getBestByGenre(newGenre);
            await renderMovieCards(movieContainer, movies, false);
        };

        await setupGenreDropdown(dropdownMenu, dropdownButton, updateMovies);
    }

    // Initial render
    await renderMovieCards(movieContainer, movies, false);

    // Setup resize handler
    const handleResize = debounce(() => {
        const isExpanded = movieContainer.dataset.expanded === 'true';
        renderMovieCards(movieContainer, movies, isExpanded);
    }, 250);

    window.addEventListener('resize', handleResize);

    document.body.appendChild(categorySection);
    return categorySection;
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

// Function that create the 3 categories and the selectable category
async function setCategories() {
    // Create fixed categories
    await createCategorySection("Action");
    await createCategorySection("Drama");
    await createCategorySection("News");

    // Create dynamic category
    await createCategorySection("", true);
}

// Modal functionalities
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

    // Update other fields
    document.getElementById('modal-movie-title').textContent = movie.original_title;
    document.getElementById('modal-movie-release-date').textContent = movie.year;
    document.getElementById('modal-movie-genres').textContent = movie.genres;
    document.getElementById('modal-movie-rating').textContent = movie.rated;
    document.getElementById('modal-movie-duration').textContent = `${movie.duration} minutes`;
    document.getElementById('modal-movie-country').textContent = movie.countries;
    document.getElementById('modal-movie-score').textContent = `IMDB score: ${movie.imdb_score}/10`;
    document.getElementById('modal-movie-director').textContent = `Réalisé par: ${movie.director}`;
    let box_office_data = movie.budget ? `${movie.budget} ${movie.budget_currency}` : `Non disponible`;
    document.getElementById('modal-movie-box-office').textContent = `Box office: ${box_office_data}`;
    document.getElementById('modal-movie-description').textContent = movie.long_description;
    document.getElementById('modal-movie-actors').textContent = `Avec: ${movie.actors}`;

    // Display modal
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('movieModal');
    modal.style.display = 'none';
}

// Main initialization
async function init() {
    await createBestMovieSection();
    await setCategories();
    await createModal();

    // Add global click event to close modal when clicking outside
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('movieModal');
        if (event.target === modal) {
            closeModal();
        }
    });
}

// Run initialization
document.addEventListener('DOMContentLoaded', () => init());
