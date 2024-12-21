let api_address = "http://localhost:8000/api/v1/"

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
    // Create dropdown section with Bootstrap container
    const dropdownSection = document.createElement('section');
    dropdownSection.classList.add('container', 'my-5');

    // Create title row
    const titleRow = document.createElement('div');
    titleRow.classList.add('row', 'mb-4');
    const titleCol = document.createElement('div');
    titleCol.classList.add('col', 'd-flex', 'align-items-center', 'gap-3');

    // Create dropdown title
    const dropdownTitle = document.createElement('h2');
    dropdownTitle.textContent = 'Autre';
    titleCol.appendChild(dropdownTitle);

    // Create dropdown container
    const dropdownContainer = document.createElement('div');
    dropdownContainer.classList.add('dropdown');

    // Create dropdown button
    const dropdownButton = document.createElement('button');
    dropdownButton.classList.add('btn', 'btn-secondary', 'dropdown-toggle');
    dropdownButton.setAttribute('data-bs-toggle', 'dropdown');
    dropdownButton.setAttribute('aria-expanded', 'false');

    // Create dropdown menu
    const dropdownMenu = document.createElement('ul');
    dropdownMenu.classList.add('dropdown-menu');
    dropdownMenu.id = 'dropdown-content';

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

    // Assemble dropdown
    dropdownContainer.appendChild(dropdownButton);
    dropdownContainer.appendChild(dropdownMenu);
    titleCol.appendChild(dropdownContainer);
    titleRow.appendChild(titleCol);
    dropdownSection.appendChild(titleRow);

    // Create movie block with Bootstrap grid
    const movieBlockRow = document.createElement('div');
    movieBlockRow.classList.add('row', 'row-cols-1', 'row-cols-md-2', 'row-cols-lg-3', 'g-4');
    movieBlockRow.id = 'dropdown-movie-block';
    dropdownSection.appendChild(movieBlockRow);

    // Append to body
    document.body.appendChild(dropdownSection);

    // Update with first genre initially
    if (genres.length > 0) {
        await updateMovieSection(genres[0].name, dropdownButton);
    }
}

async function createMovieCard(movie, containerType = 'col') {
    const movieCol = document.createElement('div');
    movieCol.classList.add(containerType);

    const movieCard = document.createElement('div');
    movieCard.classList.add('card', 'movie-card', 'h-100', 'border-0');

    // Create image container for position reference
    const imageContainer = document.createElement('div');
    imageContainer.classList.add('card-img-container', 'position-relative', 'h-100');

    // Movie image
    const movieImage = document.createElement('img');
    movieImage.src = movie.image_url;
    movieImage.alt = movie.original_title;
    movieImage.classList.add('card-img', 'h-100', 'w-100', 'object-fit-cover');
    movieImage.addEventListener("error", () => {
        movieImage.src = "images/404.jpg";
    });

    // Overlay bar with title and button
    const overlayBar = document.createElement('div');
    overlayBar.classList.add('overlay-bar', 'd-flex', 'justify-content-between', 'align-items-center', 'px-3', 'py-2');

    // Movie title
    const movieTitle = document.createElement('h5');
    movieTitle.classList.add('card-title', 'mb-0', 'text-white', 'text-truncate');
    movieTitle.textContent = movie.original_title;
    movieTitle.title = movie.original_title; // For tooltip on hover

    // Details button
    const detailsButton = document.createElement('button');
    detailsButton.classList.add('btn', 'btn-sm', 'btn-outline-light');
    detailsButton.textContent = 'Détails';
    detailsButton.addEventListener('click', () => {
        openModal(movie.id);
    });

    // Assemble
    overlayBar.appendChild(movieTitle);
    overlayBar.appendChild(detailsButton);
    imageContainer.appendChild(movieImage);
    imageContainer.appendChild(overlayBar);
    movieCard.appendChild(imageContainer);
    movieCol.appendChild(movieCard);

    return movieCol;
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
    let best = await getBest()

    // Create the section element with Bootstrap container
    const bestMovieSection = document.createElement('section');
    bestMovieSection.classList.add('container', 'my-5');

    // Create title row
    const titleRow = document.createElement('div');
    titleRow.classList.add('row', 'mb-4');
    const titleCol = document.createElement('div');
    titleCol.classList.add('col');
    const sectionTitle = document.createElement('h2');
    sectionTitle.textContent = 'Meilleur film';
    titleCol.appendChild(sectionTitle);
    titleRow.appendChild(titleCol);
    bestMovieSection.appendChild(titleRow);

    // Create best-movie row
    const bestMovieRow = document.createElement('div');
    bestMovieRow.classList.add('row');
    bestMovieRow.id = 'best-movie';

    // Create columns for image and content
    const imageCol = document.createElement('div');
    imageCol.classList.add('col-12', 'col-md-4');

    const contentCol = document.createElement('div');
    contentCol.classList.add('col-12', 'col-md-8');

    // Movie image
    const movieImage = document.createElement('img');
    movieImage.src = best.image_url;
    movieImage.alt = best.original_title;
    movieImage.classList.add('img-fluid', 'rounded');
    imageCol.appendChild(movieImage);

    // Movie content
    const bestMovieContent = document.createElement('div');
    bestMovieContent.classList.add('best-movie-content', 'mt-3', 'mt-md-0');

    // Movie title
    const movieTitle = document.createElement('h3');
    movieTitle.textContent = best.original_title;
    bestMovieContent.appendChild(movieTitle);

    // Movie description
    const movieDescription = document.createElement('p');
    movieDescription.textContent = best.description;
    bestMovieContent.appendChild(movieDescription);

    // Details button
    const detailsButton = document.createElement('button');
    detailsButton.classList.add('btn', 'btn-danger');
    detailsButton.textContent = 'Détails';
    detailsButton.addEventListener('click', () => {
        openModal(best.id);
    });

    // Assemble
    bestMovieContent.appendChild(detailsButton);
    contentCol.appendChild(bestMovieContent);
    bestMovieRow.appendChild(imageCol);
    bestMovieRow.appendChild(contentCol);
    bestMovieSection.appendChild(bestMovieRow);
    document.body.appendChild(bestMovieSection);
}

async function createMovieCategory(genre) {
    let bestList = await getBestByGenre(genre);

    const categorySection = document.createElement('section');
    categorySection.classList.add('container', 'my-5');

    // Create title row
    const titleRow = document.createElement('div');
    titleRow.classList.add('row', 'mb-4');
    const titleCol = document.createElement('div');
    titleCol.classList.add('col');
    const categoryTitle = document.createElement('h2');
    categoryTitle.textContent = genre;
    titleCol.appendChild(categoryTitle);
    titleRow.appendChild(titleCol);
    categorySection.appendChild(titleRow);

    // Create movie block row
    const movieBlockRow = document.createElement('div');
    movieBlockRow.classList.add('row', 'row-cols-1', 'row-cols-md-2', 'row-cols-lg-3', 'g-4');

    // Create movie cards
    for (const movie of bestList) {
        const movieCard = await createMovieCard(movie);
        movieBlockRow.appendChild(movieCard);
    }

    categorySection.appendChild(movieBlockRow);
    document.body.appendChild(categorySection);
}

async function setCategories(){
    await createMovieCategory("Action");
    await createMovieCategory("Drama")
    await createMovieCategory("News")
}

// Modal functionality
async function createModal() {
    // Create modal container
    const modal = document.createElement('div');
    modal.classList.add('modal');
    modal.id = 'movieModal';

    // Create modal content
    const modalContent = document.createElement('div');
    modalContent.classList.add('modal-content');

    // Close button
    const closeButton = document.createElement('span');
    closeButton.classList.add('modal-close');
    closeButton.innerHTML = '&times;';
    closeButton.onclick = closeModal;

    // Modal elements
    const modalImage = document.createElement('img');
    modalImage.id = 'modal-movie-image';
    const modalTitle = document.createElement('h2');
    modalTitle.id = 'modal-movie-title';
    const modalGenres = document.createElement('span');
    modalGenres.id = 'modal-movie-genres';
    const modalReleaseDate = document.createElement('span');
    modalReleaseDate.id = 'modal-movie-release-date';
    const modalScore = document.createElement('span');
    modalScore.id = 'modal-movie-score';
    const modalDirector = document.createElement('p');
    modalDirector.id = 'modal-movie-director';
    const modalActors = document.createElement('p');
    modalActors.id = 'modal-movie-actors';
    const modalDuration = document.createElement('span');
    modalDuration.id = 'modal-movie-duration';
    const modalCountry = document.createElement('span');
    modalCountry.id = 'modal-movie-country';
    const modalBoxOffice = document.createElement('p');
    modalBoxOffice.id = 'modal-movie-box-office';
    const modalDescription = document.createElement('p');
    modalDescription.id = 'modal-movie-description';
    const modalRating = document.createElement('span');
    modalRating.id = 'modal-movie-rating';

    // Assemble
    modalContent.appendChild(modalImage);
    modalContent.appendChild(modalTitle);

    modalContent.appendChild(modalReleaseDate);
    modalContent.appendChild(modalGenres);

    modalContent.appendChild(modalRating);
    modalContent.appendChild(modalDuration);
    modalContent.appendChild(modalCountry);

    modalContent.appendChild(modalScore);

    modalContent.appendChild(modalDirector);

    modalContent.appendChild(modalDescription);
    modalContent.appendChild(modalActors);

    modalContent.appendChild(modalBoxOffice); // TODO: Not in figma

    modalContent.appendChild(closeButton);
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

async function openModal(movie_id) {
    let movie = await getMovieById(movie_id)
    console.log(movie)
    const modal = document.getElementById('movieModal');

    const modalImage = document.getElementById('modal-movie-image');
    const modalTitle = document.getElementById('modal-movie-title');
    const modalGenres = document.getElementById('modal-movie-genres');
    const modalReleaseDate = document.getElementById('modal-movie-release-date');
    const modalScore = document.getElementById('modal-movie-score');
    const modalDirector = document.getElementById('modal-movie-director');
    const modalActors = document.getElementById('modal-movie-actors');
    const modalDuration = document.getElementById('modal-movie-duration');
    const modalCountry = document.getElementById('modal-movie-country');
    const modalBoxOffice = document.getElementById('modal-movie-box-office'); // TODO: Not in figma
    const modalDescription = document.getElementById('modal-movie-description');
    const modalRating = document.getElementById('modal-movie-rating');

    // Set movie title
    modalImage.src = movie.image_url;
    modalImage.alt = movie.original_title;
    // If there's an error, use 404 image instead
    modalImage.addEventListener("error", () => {
        modalImage.src = "images/404.jpg";
    });
    modalTitle.textContent = movie.original_title;
    if (movie.title != movie.original_title)
        modalTitle.textContent = " (" + movie.title + ")";
    modalGenres.textContent = movie.genres;
    modalReleaseDate.textContent = movie.year;
    modalScore.textContent = "IMDB score: " + movie.imdb_score + "/10";
    modalDirector.textContent = "Réalisé par: " + movie.director;
    modalActors.textContent = "Avec: " + movie.actors;
    modalDuration.textContent = movie.duration + " minutes";
    modalCountry.textContent = "(" + movie.countries + ")";
    modalBoxOffice.textContent = movie.budget + " " + movie.budget_currency; // TODO: Not in figma
    modalDescription.textContent = movie.long_description; // TODO: Long description and description not always in same langage?
    modalRating.textContent = movie.rated;

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
init();
