import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import { elements, renderLoader, clearLoader } from './views/base';

/** Global state of the app
* - Search object
* - Current recipe object
* - Shopping list object
* - liked recipies
*/
const state = {};

const controlSearch = async () => {
	
	// 1) get query from view
	const query = searchView.getInput();

	if (query)
	{
		// 2) new search object and add to state
		state.search = new Search(query);

		// 3) prepare UI for results
		searchView.clearInput();
		searchView.clearResults();
		renderLoader(elements.searchRes);

		try
		{	// 4) search for recipes
			await state.search.getResults();

			// 5) render results in UI
			clearLoader();
			searchView.renderResults(state.search.result);
		}
		catch (error)
		{
			alert('Something went wrong with the search :(');
			clearLoader();
		}
	}
}

elements.searchForm.addEventListener('submit', e => {
	e.preventDefault(); //prevents page from reload (?)
	controlSearch();
});

// EVENT DELEGATION
elements.searchResPages.addEventListener('click', e => {
	const btn = e.target.closest('.btn-inline')
	if (btn)
	{
		const goToPage = parseInt(btn.dataset.goto);
		searchView.clearResults();
		searchView.renderResults(state.search.result, goToPage);
	}
});


/*
* RECIPE CONTROLLER
*/
const controlRecipe = async () => {
	// get ID from url
	const id = window.location.hash.replace('#', '');

	if (id)
	{
		// prepare UI for changes
		recipeView.clearRecipe();
		renderLoader(elements.recipe);

		if (state.search) searchView.highlightSelected(id);

		// create new recipe object
		state.recipe = new Recipe(id);
		try 
		{
			// get recipe data and parse ingredients
			await state.recipe.getRecipe();
			state.recipe.parseIngredients();

			// calculate servings and time
			state.recipe.calcTime();
			state.recipe.calcServings();

			// render recipe
			clearLoader();
			recipeView.renderRecipe(state.recipe, state.likes.isLiked(id));
		}
		catch (error)
		{
			alert('Error processing recipe !');
			clearLoader();
		}
	}
}

['load', 'hashchange'].forEach(event => window.addEventListener(event, controlRecipe));


//handling recipe button clicks
// EVENT DELEGATION
elements.recipe.addEventListener('click', e => {
	if (e.target.matches('.btn-decrease, .btn-decrease *'))
	{
		//decrease button in clicked
		if (state.recipe.servings > 1)
			{
				state.recipe.updateServings('decrease');
				recipeView.updateServingsIngredients(state.recipe);
			}
	}
	else if (e.target.matches('.btn-increase, .btn-increase *'))
	{
		//increase button in clicked
		state.recipe.updateServings('increase');
		recipeView.updateServingsIngredients(state.recipe);
	}
	else if (e.target.matches('recipe__btn--add, .recipe__btn--add *'))
	{
		controlList();
	}
	else if (e.target.matches('.recipe__love, .recipe__love *'))
	{
		controlLikes();
	}
	
});


/* 
* LIST CONTROLLER
*
*/
const controlList = () =>
{
	if (!state.list) state.list = new List();

	//Add each ingredient to the list
	state.recipe.ingredients.forEach(el => {
		const item = state.list.addItem(el.count, el.unit, el.ingredient);
		listView.renderItem(item);
	});
}

// Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
	//obtengo el ID
	const id = e.target.closest('.shopping__item').dataset.itemid;

	//handle delete button
	if (e.target.matches('.shopping__delete, .shopping__delete *'))
	{
		//delete from state
		state.list.deleteItem(id);

		//delete from UI
		listView.deleteItem(id);
	}
	else //handle count update
		if (e.target.matches('.shopping__count-value'))
		{
			const val = parseFloat(e.target.value);
			state.list.updateCount(id, val);
		}
});

/* 
* LIKES CONTROLLER
*
*/
const controlLikes = () => {
	if (!state.likes) state.likes = new Likes();
	const currentID = state.recipe.id;

	// user has NOT YET liked current recipe
	if (!state.likes.isLiked(currentID))
	{
		// add like to the state
		const newLike = state.likes.addLike(
			currentID,
			state.recipe.title,
			state.recipe.author,
			state.recipe.img
			);

		// toggle the like button
		likesView.toggleLikeBtn(true);

		//add like to the UI list
		likesView.renderLike(newLike);
	}
	// user HAS liked current recipe
	else
	{
		// remove the like from the state
		state.likes.deleteLike(currentID);

		// toggle the like button
		likesView.toggleLikeBtn(false);

		// remove like from the UI list
		likesView.deleteLike(currentID);

	}
	likesView.toggleLikeMenu(state.likes.getNumLikes());
}

//restore liked recipes on page load
window.addEventListener('load', () => {
	state.likes = new Likes();

	//restore likes from previous sessions
	state.likes.readStorage();

	//toggle likes menu button
	likesView.toggleLikeMenu(state.likes.getNumLikes());

	//render the existing likes
	state.likes.likes.forEach(like => likesView.renderLike(like));
});

