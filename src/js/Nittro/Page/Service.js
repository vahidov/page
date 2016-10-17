_context.invoke('Nittro.Page', function (Transaction, DOM, Arrays, Url) {

    var Service = _context.extend('Nittro.Object', function (ajaxAgent, snippetAgent, historyAgent, snippetManager, options) {
        Service.Super.call(this);

        this._.ajaxAgent = ajaxAgent;
        this._.snippetAgent = snippetAgent;
        this._.historyAgent = historyAgent;
        this._.snippetManager = snippetManager;
        this._.options = Arrays.mergeTree({}, Service.defaults, options);
        this._.setup = false;
        this._.currentTransaction = null;
        this._.currentUrl = Url.fromCurrent();

        DOM.addListener(window, 'popstate', this._handleState.bind(this));
        DOM.addListener(document, 'click', this._handleLinkClick.bind(this));
        this.on('error:default', this._showError.bind(this));

        this._checkReady();

    }, {
        STATIC: {
            defaults: {
                whitelistLinks: false
            }
        },

        open: function (url, method, data, context) {
            try {
                context || (context = {});
                context.method = method;
                context.data = data;

                var transaction = this._createTransaction(url),
                    promise;

                transaction.init(context);

                promise = this._dispatchTransaction(transaction);

                context.event && context.event.preventDefault();

                return promise;

            } catch (e) {
                return Promise.reject(e);

            }
        },

        openLink: function (link, evt) {
            return this.open(link.href, 'get', null, {
                event: evt,
                element: link
            });
        },

        getSnippet: function (id) {
            return this._.snippetManager.getSnippet(id);

        },

        isSnippet: function (elem) {
            return this._.snippetManager.isSnippet(elem);

        },

        _handleState: function (evt) {
            if (evt.state === null) {
                return;
            }

            if (!this._checkUrl(null, this._.currentUrl)) {
                return;

            }

            var url = Url.fromCurrent();
            this._.currentUrl = url;

            try {
                this.open(url, 'get', null, {history: false});

            } catch (e) {
                document.location.href = url.toAbsolute();

            }
        },

        _checkReady: function () {
            if (document.readyState === 'loading') {
                DOM.addListener(document, 'readystatechange', this._checkReady.bind(this));
                return;

            }

            if (!this._.setup) {
                this._.setup = true;

                window.setTimeout(function () {
                    window.history.replaceState({_nittro: true}, document.title, document.location.href);
                    this._.snippetManager.setup();
                    this._showHtmlFlashes();
                    this.trigger('update');

                }.bind(this), 1);
            }
        },

        _handleLinkClick: function(evt) {
            if (evt.defaultPrevented || evt.ctrlKey || evt.shiftKey || evt.altKey || evt.metaKey || evt.button > 0) {
                return;

            }

            var link = DOM.closest(evt.target, 'a');

            if (!link || !this._checkLink(link) || !this._checkUrl(link.href)) {
                return;

            }

            this.openLink(link, evt);

        },

        _createTransaction: function(url) {
            var transaction = new Transaction(url);

            transaction.add('ajax', this._.ajaxAgent);
            transaction.add('snippets', this._.snippetAgent);
            transaction.add('history', this._.historyAgent);

            this.trigger('transaction-created', {
                transaction: transaction
            });

            return transaction;

        },

        _dispatchTransaction: function(transaction) {
            if (this._.currentTransaction) {
                this._.currentTransaction.abort();
            }

            this._.currentTransaction = transaction;

            return transaction.dispatch().then(
                this._handleSuccess.bind(this, transaction),
                this._handleError.bind(this)
            );

        },

        _checkUrl: function(url, current) {
            return this._.ajaxAgent.checkUrl(url, current);

        },

        _checkLink: function (link) {
            if (link.getAttribute('target')) {
                return false;
            }

            return this._.options.whitelistLinks ? DOM.hasClass(link, 'nittro-ajax') : !DOM.hasClass(link, 'nittro-no-ajax');

        },

        _showFlashes: function (flashes) {
            if (!flashes) {
                return;

            }

            var id, i;

            for (id in flashes) {
                if (flashes.hasOwnProperty(id) && flashes[id]) {
                    for (i = 0; i < flashes[id].length; i++) {
                        flashes[id][i].target = id;
                        this.trigger('flash', flashes[id][i]);

                    }
                }
            }
        },

        _showHtmlFlashes: function () {
            var elms = DOM.getByClassName('nittro-flashes-src'),
                i, n, data;

            for (i = 0, n = elms.length; i < n; i++) {
                data = JSON.parse(elms[i].textContent.trim());
                elms[i].parentNode.removeChild(elms[i]);
                this._showFlashes(data);

            }
        },

        _handleSuccess: function(transaction) {
            if (transaction.isHistoryState()) {
                this._.currentUrl = transaction.getUrl();

            }

            this.trigger('update');

        },

        _handleError: function (err) {
            this.trigger('error', err);

        },

        _showError: function (evt) {
            if (evt.data.type === 'connection') {
                this.trigger('flash', {
                    type: 'error',
                    message: 'There was an error connecting to the server. Please check your internet connection and try again.'
                });
            } else if (evt.data.type !== 'abort') {
                this.trigger('flash', {
                    type: 'error',
                    message: 'There was an error processing your request. Please try again later.'
                });
            }
        }
    });

    _context.register(Service, 'Service');

}, {
    DOM: 'Utils.DOM',
    Arrays: 'Utils.Arrays',
    Url: 'Utils.Url'
});
