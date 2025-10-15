export default class TestExtension {
    getConfig() {
        return {
            name: "Test2",
            description: "A test extension",
            types: {
                test: "A test type"
            }
        }
    }

    add() {
        console.log("TestExtension add")
    }
}