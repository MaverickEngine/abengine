interface IAbEngineAPI {
    restUrl: string;
    restNonce: string;
}

export default class ABEngineAPI implements IAbEngineAPI {
    restUrl: string;
    restNonce: string;

    constructor(restUrl: string, restNonce: string) {
        this.restUrl = restUrl;
        this.restNonce = restNonce;
    }

    init() {
        const abengine_elements = document.querySelectorAll(`div[class^='abengine-']`);
        if (!abengine_elements.length) return; // No mathing elements, nothing to do here
        console.log(abengine_elements);
    }
}