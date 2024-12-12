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
    // Create dropdown section
    const dropdownSection = document.createElement('section');
    dropdownSection.classList.add('category-section');

    // Create title div
    const titleDiv = document.createElement('div');
    titleDiv.classList.add('title');

    // Create dropdown title
    const dropdownTitle = document.createElement('h2');
    dropdownTitle.textContent = 'Autre';
    titleDiv.appendChild(dropdownTitle);

    // Create dropdown container
    const dropdownContainer = document.createElement('div');
    dropdownContainer.classList.add('dropdown');

    // Create dropdown button
    const dropdownButton = document.createElement('button');
    dropdownButton.classList.add('dropbtn');

    // Create dropdown content
    const dropdownContent = document.createElement('div');
    dropdownContent.classList.add('dropdown-content');
    dropdownContent.id = 'dropdown-content';

    // Populate dropdown with genres
    genres.forEach(genre => {
        const genreLink = document.createElement('a');
        genreLink.href = '#';
        genreLink.textContent = genre.name;
        genreLink.addEventListener('click', (event) => {
            // Prevent default link behavior (scrolling to top) and stop event from propagating
            event.preventDefault();
            event.stopPropagation();

            updateMovieSection(genre.name, dropdownButton);
        });
        dropdownContent.appendChild(genreLink);
    });

    // Assemble dropdown
    dropdownContainer.appendChild(dropdownButton);
    dropdownContainer.appendChild(dropdownContent);
    titleDiv.appendChild(dropdownContainer);
    dropdownSection.appendChild(titleDiv);

    // Create movie block for dropdown section
    const movieBlockDiv = document.createElement('div');
    movieBlockDiv.classList.add('movie-block');
    movieBlockDiv.id = 'dropdown-movie-block';
    dropdownSection.appendChild(movieBlockDiv);

    // Append to body
    document.body.appendChild(dropdownSection);

    // Update with first genre initially
    if (genres.length > 0) {
        await updateMovieSection(genres[0].name, dropdownButton);
    }
}

async function updateMovieSection(genre, dropdownButton) {
    const movieBlock = document.getElementById('dropdown-movie-block');
    movieBlock.innerHTML = ''; // Clear existing movies

    // Update dropdown button text to show current genre
    if (dropdownButton) {
        dropdownButton.textContent = genre;
    }

    try {
        const bestList = await getBestByGenre(genre);

        bestList.forEach(movie => {
            const movieElem = document.createElement('div');
            movieElem.classList.add('movie-elem');

            // Create movie title div
            const movieTitleDiv = document.createElement('div');
            movieTitleDiv.classList.add('movie-title');

            // Movie title
            const movieTitle = document.createElement('h3');
            movieTitle.textContent = movie.title;
            movieTitleDiv.appendChild(movieTitle);

            // Details button
            const detailsButton = document.createElement('button');
            detailsButton.classList.add('details-button');
            detailsButton.textContent = 'Détails';

            // Add event listener for details button
            detailsButton.addEventListener('click', () => {
                openModal(movie.id);
            });

            movieTitleDiv.appendChild(detailsButton);

            // Add movie title div to movie element
            movieElem.appendChild(movieTitleDiv);

            // Movie image
            const movieImage = document.createElement('img');
            movieImage.src = movie.image_url;
            movieImage.alt = movie.title;
            movieImage.addEventListener("error", () => {
                movieImage.src = "images/404.jpg";
            });
            movieElem.appendChild(movieImage);

            // Add movie element to movie block
            movieBlock.appendChild(movieElem);
        });

        // Call enhanceDetailsButtons to ensure any missed buttons get listeners
        // await enhanceDetailsButtons();
    } catch (error) {
        console.error('Error updating movie section:', error);
    }
}

async function createBestMovieSection() {
    let best = await getBest()

    // Create the section element
    const bestMovieSection = document.createElement('section');
    bestMovieSection.classList.add('best-movie-section');

    // Create title div
    const titleDiv = document.createElement('div');
    titleDiv.classList.add('title');
    const sectionTitle = document.createElement('h2');
    sectionTitle.textContent = 'Meilleur film';
    titleDiv.appendChild(sectionTitle);
    bestMovieSection.appendChild(titleDiv);

    // Create best-movie div
    const bestMovieDiv = document.createElement('div');
    bestMovieDiv.id = 'best-movie';

    // Movie image
    const movieImage = document.createElement('img');
    movieImage.src = best.image_url;
    movieImage.alt = best.title;
    bestMovieDiv.appendChild(movieImage);

    // Movie content div
    const bestMovieContent = document.createElement('div');
    bestMovieContent.classList.add('best-movie-content');

    // Movie title
    const movieTitle = document.createElement('h3');
    movieTitle.textContent = best.title;
    bestMovieContent.appendChild(movieTitle);

    // Movie description
    const movieDescription = document.createElement('p');
    movieDescription.textContent = best.description;
    bestMovieContent.appendChild(movieDescription);

    // Details button
    const detailsButton = document.createElement('button');
    detailsButton.classList.add('details-button');
    detailsButton.textContent = 'Détails';
    detailsButton.addEventListener('click', () => {
        openModal(best.id);
    });

    // Assemble
    bestMovieContent.appendChild(detailsButton);
    bestMovieDiv.appendChild(bestMovieContent);
    bestMovieSection.appendChild(bestMovieDiv);
    document.body.appendChild(bestMovieSection);
}

async function createMovieCategory(genre) {
    let bestList = await getBestByGenre(genre)

    // Create the main section element
    const categorySection = document.createElement('section');
    categorySection.classList.add('category-section');

    // Create and append the title
    const titleDiv = document.createElement('div');
    titleDiv.classList.add('title');
    const categoryTitle = document.createElement('h2');
    categoryTitle.textContent = genre;
    titleDiv.appendChild(categoryTitle);
    categorySection.appendChild(titleDiv);

    // Create movie block div
    const movieBlockDiv = document.createElement('div');
    movieBlockDiv.classList.add('movie-block');

    // Loop through movies and create movie elements
    bestList.forEach(movie => {
        const movieElem = document.createElement('div');
        movieElem.classList.add('movie-elem');

        // Create movie title div
        const movieTitleDiv = document.createElement('div');
        movieTitleDiv.classList.add('movie-title');

        // Movie title
        const movieTitle = document.createElement('h3');
        movieTitle.textContent = movie.title;
        movieTitleDiv.appendChild(movieTitle);

        // Details button
        const detailsButton = document.createElement('button');
        detailsButton.classList.add('details-button');
        detailsButton.textContent = 'Détails';
        detailsButton.addEventListener('click', () => {
            openModal(movie.id);
        });

        movieTitleDiv.appendChild(detailsButton);

        // Add movie title div to movie element
        movieElem.appendChild(movieTitleDiv);

        // Movie image
        const movieImage = document.createElement('img');
        movieImage.src = movie.image_url;
        movieImage.alt = movie.title;
        // If there's an error, use 404 image instead
        movieImage.addEventListener("error", () => {
            movieImage.src = "images/404.jpg";
        });
        movieElem.appendChild(movieImage);

        // Add movie element to movie block
        movieBlockDiv.appendChild(movieElem);
    });

    // Assemble
    categorySection.appendChild(movieBlockDiv);
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

    // modalContent.appendChild(modalBoxOffice); // TODO: Not in figma

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
    // const modalBoxOffice = document.getElementById('modal-movie-box-office'); // TODO: Not in figma
    const modalDescription = document.getElementById('modal-movie-description');
    const modalRating = document.getElementById('modal-movie-rating');

    // Set movie title
    modalImage.src = movie.image_url;
    modalImage.alt = movie.title;
    // If there's an error, use 404 image instead
    modalImage.addEventListener("error", () => {
        modalImage.src = "images/404.jpg";
    });
    modalTitle.textContent = movie.title;
    if (movie.title != movie.original_title)
        modalTitle.textContent += " (" + movie.original_title + ")";
    modalGenres.textContent = movie.genres;
    modalReleaseDate.textContent = movie.year;
    modalScore.textContent = "IMDB score: " + movie.imdb_score + "/10";
    modalDirector.textContent = "Réalisé par: " + movie.director;
    modalActors.textContent = "Avec: " + movie.actors;
    modalDuration.textContent = movie.duration + " minutes";
    modalCountry.textContent = "(" + movie.countries + ")";
    // modalBoxOffice.textContent = movie.budget + " " + movie.budget_currency; // TODO: Not in figma
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
