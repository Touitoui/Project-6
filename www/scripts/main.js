let api_address = "http://localhost:8000/api/v1/"

async function getMovieById(id) {
    console.log(api_address + "titles/" + id)
    const res = await fetch(api_address + "titles/" + id)
    return await res.json();
}

async function getBest() {
    const res = await fetch(api_address + "titles/?lang_contains=fr&sort_by=-imdb_score")
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
        updateMovieSection(genres[0].name, dropdownButton);
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
                openModal(movie.title);
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
        enhanceDetailsButtons();
    } catch (error) {
        console.error('Error updating movie section:', error);
    }
}

// async function setDropdown(){
//     let genres = await getGenres()
//     let dropdownElement = document.getElementById("dropdown-content");
//     for (let i = 0; i < genres.length; i++) {
//         let genreElement = document.createElement("a");
//         genreElement.href = "#"
//         genreElement.innerHTML = genres[i].name
//         dropdownElement.appendChild(genreElement);
//     }
//     return genres[0]
// }

async function setBest(){
    let best = await getBest()

    // Movie image
    const movieImage = document.querySelector('#best-movie img');
    movieImage.src = best.image_url;
    movieImage.alt = best.title;

    // Movie title
    const movieTitle = document.querySelector('#best-movie h3');
    movieTitle.textContent = best.title;

    // Movie description
    const movieDescription = document.querySelector('#best-movie p');
    movieDescription.textContent = best.long_description;
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
        detailsButton.textContent = 'Détails';
        detailsButton.classList.add('details-button');
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

    // Add movie block to category section
    categorySection.appendChild(movieBlockDiv);

    // Append to body
    document.body.appendChild(categorySection);
}

async function setCategories(){
    // let genresList = await getGenres()
    // console.log(genresList)
    // for (let i = 0; i < genresList.length; i++)
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

    // Modal title
    const modalTitle = document.createElement('h2');
    modalTitle.id = 'modal-movie-title';

    // Assemble modal
    modalContent.appendChild(closeButton);
    modalContent.appendChild(modalTitle);
    modal.appendChild(modalContent);

    // Add to body
    document.body.appendChild(modal);
}

function openModal(title) {
    const modal = document.getElementById('movieModal');
    const modalTitle = document.getElementById('modal-movie-title');

    // Set movie title
    modalTitle.textContent = title;

    // Display modal
    modal.style.display = 'block';
}

function closeModal() {
    const modal = document.getElementById('movieModal');
    modal.style.display = 'none';
}

// Modify existing functions to add modal event listeners
async function enhanceDetailsButtons() {
    // Select all details buttons
    const detailsButtons = document.querySelectorAll('.details-button');

    detailsButtons.forEach(button => {
        button.addEventListener('click', (event) => {
            // Get the movie title from the sibling h3 element
            const title = button.parentElement.querySelector('h3').textContent;
            openModal(title);
        });
    });
}


// Main initialization
async function init() {
    await setBest();
    await setCategories();
    const genres = await getGenres();
    await createDropdown(genres);

        await createModal();

    // Add event listeners to details buttons
    await enhanceDetailsButtons();

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