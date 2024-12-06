async function getBest() {
    const res = await fetch("http://localhost:8000/api/v1/titles/?lang_contains=fr&sort_by=-imdb_score")
    let bestList = await res.json();
    console.log(bestList.results[0])

    const res2 = await fetch("http://localhost:8000/api/v1/titles/" + bestList.results[0].id)
    let best = await res2.json();
    console.log(best)

    return best
}

//TODO: Return 6 elements instead of 5
async function getBestByGenre(genre) {
    const res = await fetch("http://localhost:8000/api/v1/titles/?sort_by=-imdb_score&genre=" + genre)
    let bestList = await res.json();
    console.log(bestList.results)

    return bestList.results
}

async function getGenres() {
    let genres;
    const res = await fetch('http://localhost:8000/api/v1/genres/')
    genres = await res.json();
//    console.log(genres.results)
    return genres.results
}

async function setDropdown(){
    let genres = await getGenres()
    let dropdownElement = document.getElementById("dropdown-content");
    for (let i = 0; i < genres.length; i++) {
        let genreElement = document.createElement("a");
        genreElement.href = "#"
        genreElement.innerHTML = genres[i].name
        dropdownElement.appendChild(genreElement);
    }
}

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
    console.log(bestList)

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
        movieTitleDiv.appendChild(detailsButton);

        // Add movie title div to movie element
        movieElem.appendChild(movieTitleDiv);

        // Movie image
        const movieImage = document.createElement('img');
        movieImage.src = movie.image_url;
        movieImage.alt = movie.title;
        movieElem.appendChild(movieImage);

        // Add movie element to movie block
        movieBlockDiv.appendChild(movieElem);
    });

    // Add movie block to category section
    categorySection.appendChild(movieBlockDiv);

    // Append to body
    //TODO: Best way?
    document.body.appendChild(categorySection);
}

setDropdown()
setBest()
createMovieCategory("Action")