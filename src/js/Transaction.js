_context.invoke('Nittro.Page', function(Url, undefined) {

    var Transaction = _context.extend('Nittro.Object', function (url) {
        Transaction.Super.call(this);

        this._.url = Url.from(url);
        this._.history = true;

        this._.promise = new Promise(function(fulfill, reject) {
            this._.fulfill = fulfill;
            this._.reject = reject;
        }.bind(this));

    }, {
        getUrl: function() {
            return this._.url;
        },

        setUrl: function(url) {
            this._.url = Url.from(url);
            return this;
        },

        isHistoryState: function() {
            return this._.history;
        },

        setIsHistoryState: function(value) {
            this._.history = value;
            return this;
        },

        dispatch: function() {
            this.trigger('dispatch')
                .then(this._.fulfill.bind(this), this._.reject.bind(this));

            return this;

        },

        abort: function() {
            this._.reject({type: 'abort'});
            this.trigger('abort');
            return this;

        },

        then: function(onfulfilled, onrejected) {
            return this._.promise.then(onfulfilled, onrejected);
        }
    });

    _context.register(Transaction, 'Transaction');

}, {
    Url: 'Utils.Url'
});
