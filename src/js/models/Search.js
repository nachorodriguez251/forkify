import axios from 'axios'; //name from package.json

export default class Search
{
	constructor(query)
	{
		this.query = query;
	}

	async getResults(query)
	{
		try
		{
			//axios instead of fetch()
			const res = await axios(`https://forkify-api.herokuapp.com/api/search?q=${this.query}`);
			this.result = res.data.recipes;
		}
		catch(error)
		{
			alert(error);
		}
	}

}
