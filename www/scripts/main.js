// Constants
const CONFIG = {
    api_address: "http://localhost:8000/api/v1/",
    DISPLAY_COUNTS: {
        mobile: 2,
        tablet: 4,
        default: Number.POSITIVE_INFINITY
    },
    MOBILE_BREAKPOINT: 768,
    TABLET_BREAKPOINT: 1024
};

// API handling class
class APIService {
    constructor(apiAddress) {
        this.apiAddress = apiAddress;
    }

    //Call to the API, get all data of a movie by its ID
    async getMovieById(id) {
        console.log(this.apiAddress + "titles/" + id);
        const res = await fetch(this.apiAddress + "titles/" + id);
        return await res.json();
    }

    //Call to the API, get the best movie
    async getBest() {
        const res = await fetch(this.apiAddress + "titles/?sort_by=-imdb_score");
        let bestList = await res.json();
        return await this.getMovieById(bestList.results[0].id);
    }

    //Call to the API, get the 6 best movies of a given genre
    async getBestByGenre(genre) {
        const res = await fetch(this.apiAddress + "titles/?sort_by=-imdb_score&genre=" + genre);
        let bestList = await res.json();
        let movie_list = [...bestList.results];
        if (bestList.next) {
            const res2 = await fetch(bestList.next);
            let bestList2 = await res2.json();
            movie_list.push(bestList2.results[0]);
        }

        let results = [];
        for (let i = 0; i < movie_list.length; i++)
            results.push(await this.getMovieById(movie_list[i].id));

        return results;
    }

    //Call to the API, get all genres
    async getGenres() {
        let next = this.apiAddress + "genres/";
        let genres = [];
        console.log("Genre calls:");
        while (next) {
            const res = await fetch(next);
            let json = await res.json();
            console.log(json.results);
            next = json.next;
            genres.push([...json.results]);
        }
        genres = genres.flat(1);
        console.log("Genres:");
        console.log(genres);
        return genres;
    }
}

// UI Components class
class UIComponents {
    constructor(apiService) {
        this.apiService = apiService;
    }

    //Function to create the movie cards
    async createMovieCard(movie) {
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
        cardContainer.style.cursor = 'pointer';
        cardContainer.addEventListener('click', (event) => {
            if (!event.target.classList.contains('btn')) {
                this.openModal(movie.id);
            }
        });

        const detailsButton = movieCard.querySelector('.btn');
        detailsButton.addEventListener('click', (event) => {
            event.stopPropagation();
            this.openModal(movie.id);
        });

        return movieCard;
    }

    // Function to create and setup the toggle button
    createToggleButton(isExpanded, onClick) {
        const buttonCol = document.createElement('div');
        buttonCol.classList.add('col-12', 'text-center', 'mt-4');

        const toggleBtn = document.createElement('button');
        toggleBtn.classList.add('btn', 'btn-primary');
        toggleBtn.textContent = isExpanded ? 'Voir moins' : 'Voir plus';
        toggleBtn.addEventListener('click', onClick);

        buttonCol.appendChild(toggleBtn);
        return buttonCol;
    }

    async createModal() {
        if (document.getElementById('movieModal')) {
            return;
        }

        const template = document.getElementById('movie-modal-template');
        const modal = template.content.cloneNode(true);

        const mobileCloseButton = modal.querySelector('.mobile-close');
        const desktopCloseButton = modal.querySelector('.desktop-close');

        mobileCloseButton.onclick = () => this.closeModal();
        desktopCloseButton.onclick = () => this.closeModal();

        document.body.appendChild(modal);
    }

    async openModal(movie_id) {
        let movie = await this.apiService.getMovieById(movie_id);
        const modal = document.getElementById('movieModal');

        const modalImage = document.getElementById('modal-movie-image');
        modalImage.src = movie.image_url;
        modalImage.alt = movie.original_title;
        modalImage.addEventListener("error", () => {
            modalImage.src = "images/404.jpg";
        });

        document.getElementById('modal-movie-title').textContent = movie.original_title;
        document.getElementById('modal-movie-release-date').textContent = movie.year;
        document.getElementById('modal-movie-genres').textContent = movie.genres;
        document.getElementById('modal-movie-rating').textContent = movie.rated;
        document.getElementById('modal-movie-duration').textContent = `${movie.duration} minutes`;
        document.getElementById('modal-movie-country').textContent = movie.countries;
        document.getElementById('modal-movie-score').textContent = `IMDB score: ${movie.imdb_score}/10`;
        document.getElementById('modal-movie-director').textContent = `${movie.director}`;
        let box_office_data = movie.budget ? `${movie.budget} ${movie.budget_currency}` : `Non disponible`;
        document.getElementById('modal-movie-box-office').textContent = `Box office: ${box_office_data}`;
        document.getElementById('modal-movie-description').textContent = movie.long_description;
        document.getElementById('modal-movie-actors').textContent = `${movie.actors}`;

        modal.style.display = 'block';
    }

    closeModal() {
        const modal = document.getElementById('movieModal');
        modal.style.display = 'none';
    }
}

// Category Management class
class CategoryManager {
    constructor(apiService, uiComponents) {
        this.apiService = apiService;
        this.uiComponents = uiComponents;
    }

    async createBestMovieSection() {
        let best = await this.apiService.getBest();

        const template = document.getElementById('best-movie-section-template');
        const bestMovieSection = template.content.cloneNode(true);

        const imgContainer = bestMovieSection.querySelector('.col-12.col-md-4');
        const img = imgContainer.querySelector('img');

        imgContainer.style.cursor = 'pointer';

        img.src = best.image_url;
        img.alt = best.original_title;
        img.addEventListener("error", () => {
            img.src = "images/404.jpg";
        });

        imgContainer.addEventListener('click', () => {
            this.uiComponents.openModal(best.id);
        });

        const title = bestMovieSection.querySelector('h3');
        title.textContent = best.original_title;

        const description = bestMovieSection.querySelector('.description');
        description.textContent = best.description;

        const button = bestMovieSection.querySelector('button');
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            this.uiComponents.openModal(best.id);
        });

        document.body.appendChild(bestMovieSection);
    }

    // Function to determine how many cards to display
    getDisplayCount(windowWidth) {
        if (windowWidth < CONFIG.MOBILE_BREAKPOINT) return CONFIG.DISPLAY_COUNTS.mobile;
        if (windowWidth < CONFIG.TABLET_BREAKPOINT) return CONFIG.DISPLAY_COUNTS.tablet;
        return CONFIG.DISPLAY_COUNTS.default;
    }

    async setupGenreDropdown(dropdownMenu, dropdownButton, updateMovies) {
        const genres = await this.apiService.getGenres();

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

        if (genres.length > 0) {
            dropdownButton.textContent = genres[0].name;
        }
    }

    async renderMovieCards(movieContainer, movies, isExpanded) {
        movieContainer.innerHTML = '';
        const displayCount = this.getDisplayCount(window.innerWidth);
        const cardsToShow = isExpanded ? movies.length : Math.min(displayCount, movies.length);

        for (let i = 0; i < cardsToShow; i++) {
            const movieCard = await this.uiComponents.createMovieCard(movies[i]);
            movieContainer.appendChild(movieCard);
        }

        if (window.innerWidth < CONFIG.TABLET_BREAKPOINT && movies.length > displayCount) {
            const toggleButton = this.uiComponents.createToggleButton(isExpanded, async () => {
                movieContainer.dataset.expanded = (!isExpanded).toString();
                await this.renderMovieCards(movieContainer, movies, !isExpanded);
            });
            movieContainer.appendChild(toggleButton);
        }

        movieContainer.dataset.expanded = isExpanded.toString();
    }

    async createCategorySection(genre, isDynamic = false) {
        let movies = await this.apiService.getBestByGenre(genre);

        const templateId = isDynamic ? 'dropdown-section-template' : 'category-section-template';
        const template = document.getElementById(templateId);
        const categorySection = template.content.cloneNode(true);

        const title = categorySection.querySelector('h2');
        title.textContent = isDynamic ? 'Autre' : genre;

        const movieContainer = categorySection.querySelector('.row-cols-1');
        if (isDynamic) {
            movieContainer.id = 'dropdown-movie-block';

            const dropdownButton = categorySection.querySelector('.dropdown-toggle');
            const dropdownMenu = categorySection.querySelector('.dropdown-menu');

            const updateMovies = async (newGenre) => {
                movies = await this.apiService.getBestByGenre(newGenre);
                await this.renderMovieCards(movieContainer, movies, false);
            };

            await this.setupGenreDropdown(dropdownMenu, dropdownButton, updateMovies);
        }

        await this.renderMovieCards(movieContainer, movies, false);

        const handleResize = this.debounce(() => {
            const isExpanded = movieContainer.dataset.expanded === 'true';
            this.renderMovieCards(movieContainer, movies, isExpanded);
        }, 250);

        window.addEventListener('resize', handleResize);

        document.body.appendChild(categorySection);
        return categorySection;
    }

    debounce(func, wait) {
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

    async setCategories() {
        await this.createCategorySection("Action");
        await this.createCategorySection("Drama");
        await this.createCategorySection("News");
        await this.createCategorySection("", true);
    }
}

// Main Application class
class App {
    constructor() {
        this.apiService = new APIService(CONFIG.api_address);
        this.uiComponents = new UIComponents(this.apiService);
        this.categoryManager = new CategoryManager(this.apiService, this.uiComponents);
    }

    async init() {
        await this.categoryManager.createBestMovieSection();
        await this.categoryManager.setCategories();
        await this.uiComponents.createModal();

        window.addEventListener('click', (event) => {
            const modal = document.getElementById('movieModal');
            if (event.target === modal) {
                this.uiComponents.closeModal();
            }
        });
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});

//TODO: icon on dropdown for selection