let api_address = "http://localhost:8000/api/v1/"

async function getMovieById(id) {
    console.log(api_address + "titles/" + id)
    const res = await fetch(api_address + "titles/" + id)
    return await res.json();
}

async function getBest() {
    const res = await fetch(api_address + "titles/?lang_contains=fr&sort_by=-imdb_score")
    let bestList = await res.json();
    // console.log(bestList.results[0])

    return await getMovieById(bestList.results[0].id)
}

async function getBestByGenre(genre) {
    let next = api_address + "titles/?sort_by=-imdb_score&genre=" + genre
    const res = await fetch(next)
    let bestList = await res.json();
    let movie_list = [...bestList.results]
    next = bestList.next
    if (next) {
        const res2 = await fetch(next)
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

async function setDropdown(){
    let genres = await getGenres()
    let dropdownElement = document.getElementById("dropdown-content");
    for (let i = 0; i < genres.length; i++) {
        let genreElement = document.createElement("a");
        genreElement.href = "#"
        genreElement.innerHTML = genres[i].name
        dropdownElement.appendChild(genreElement);
    }
    return genres[0]
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

function addDropdown(){
    return false
}

async function createMovieCategory(genre, dropdown=false) {
    let bestList = await getBestByGenre(genre)
    console.log(bestList)

    // Create the main section element
    const categorySection = document.createElement('section');
    categorySection.classList.add('category-section');

    // Create and append the title
    const titleDiv = document.createElement('div');
    titleDiv.classList.add('title');
    const categoryTitle = document.createElement('h2');
    if (dropdown === true) {
        categoryTitle.textContent = genre;
        genre = setDropdown()
        titleDiv.appendChild(categoryTitle);
        categorySection.appendChild(titleDiv);
    }
    else {
        categoryTitle.textContent = genre;
        titleDiv.appendChild(categoryTitle);
        categorySection.appendChild(titleDiv);
    }
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
        // If there's an error, use 404 image instead
        movieImage.addEventListener("error", (event) => {
            movieImage.src = "images/404.jpg";
        })
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
    let genresList = await getGenres()
    console.log(genresList)
    for (let i = 0; i < genresList.length; i++)
        await createMovieCategory(genresList[i].name);
    // await createMovieCategory("Drama")
    // await createMovieCategory("Autre", true)
}

setDropdown()
setBest()
setCategories()
