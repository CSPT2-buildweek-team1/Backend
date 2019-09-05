class Stack {
    constructor()   {
        this.storage = [];
    }

    push(value) {
        this.storage.push(value);
    }
    pop()   {
        return this.storage.pop();
    }
}

module.exports = Stack
