interface IAbEngineAPI {
    restUrl: string;
    restNonce: string;
    abengine_url: string;
}

export default class ABEngineAPI implements IAbEngineAPI {
    restUrl: string;
    restNonce: string;
    abengine_url: string;

    constructor(restUrl: string, restNonce: string, abengine_url: string) {
        this.restUrl = restUrl;
        this.restNonce = restNonce;
        this.abengine_url = abengine_url;
        console.log(`ABEngineAPI: ${restUrl}`);
    }

    async get_tests() {
        const response = await fetch(`${this.restUrl}tests`);
        const data = await response.json();
        return data;
    }

    async init() {
        const abengine_elements: any = document.querySelectorAll(`span[class^='abengine-']`);
        if (!abengine_elements.length) return; // No mathing elements, nothing to do here
        console.log(abengine_elements);
        for (let abengine_element of abengine_elements) {
            const uid = abengine_element.dataset["abengineuid"];
            const _id = abengine_element.dataset.abengineid;
            console.log({ uid, _id });
            try {
                const data = await this.serve(_id);
                const text = data.experiment.value;
                abengine_element.innerHTML = text;
                console.log(data);
                // Add "loaded" class to element
                abengine_element.classList.add("abengine-loaded");
                // const win_data = await this.autowin(_id);
                // console.log(win_data);
            } catch (error) {
                console.log(error);
            }
        }
    }

    async serve(id) {
        const response = await fetch(`${this.abengine_url}/serve/${id}`, {
            'credentials': 'include',
        });
        const data = await response.json();
        return data;
    }

    async autowin(id) {
        const response = await fetch(`${this.abengine_url}/autowin/${id}`, {
            'credentials': 'include',
        });
        const data = await response.json();
        return data;
    }

}