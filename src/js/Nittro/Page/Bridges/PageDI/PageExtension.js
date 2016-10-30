_context.invoke('Nittro.Page.Bridges.PageDI', function (Nittro) {

    var PageExtension = _context.extend('Nittro.DI.BuilderExtension', function (containerBuilder, config) {
        PageExtension.Super.call(this, containerBuilder, config);
    }, {
        STATIC: {
            defaults: {
                whitelistHistory: false,
                whitelistLinks: false,
                whitelistRedirects: false,
                allowOrigins: null,
                transitions: {
                    defaultSelector: '.nittro-transition-auto'
                }
            }
        },
        load: function () {
            var builder = this._getContainerBuilder(),
                config = this._getConfig(PageExtension.defaults);

            builder.addServiceDefinition('page', {
                factory: 'Nittro.Page.Service()',
                args: {
                    options: {
                        whitelistLinks: config.whitelistLinks
                    }
                },
                run: true
            });

            builder.addServiceDefinition('ajaxAgent', {
                factory: 'Nittro.Page.AjaxAgent()',
                args: {
                    options: {
                        whitelistRedirects: config.whitelistRedirects,
                        allowOrigins: config.allowOrigins
                    }
                }
            });

            builder.addServiceDefinition('historyAgent', {
                factory: 'Nittro.Page.HistoryAgent()',
                args: {
                    options: {
                        whitelistHistory: config.whitelistHistory
                    }
                }
            });

            builder.addServiceDefinition('snippetAgent', 'Nittro.Page.SnippetAgent()');
            builder.addServiceDefinition('snippetManager', 'Nittro.Page.SnippetManager()');
            builder.addServiceDefinition('history', 'Nittro.Page.History()');

            if (config.transitions) {
                builder.addServiceDefinition('transitionHelper', 'Nittro.Page.TransitionHelper()');

                builder.addServiceDefinition('transitionAgent', {
                    factory: 'Nittro.Page.TransitionAgent()',
                    args: {
                        options: {
                            defaultSelector: config.transitions.defaultSelector
                        }
                    }
                });

                builder.getServiceDefinition('page')
                    .addSetup(function(transitionAgent) {
                        this.on('transaction-created', function(evt) {
                            evt.data.transaction.add('transitions', transitionAgent);
                        });
                    });
            }
        },

        setup: function() {
            var builder = this._getContainerBuilder();

            if (builder.hasServiceDefinition('flashes')) {
                builder.addServiceDefinition('flashAgent', 'Nittro.Page.Bridges.PageFlashes.FlashAgent()');

                builder.getServiceDefinition('page')
                    .addSetup(function(flashAgent) {
                        this.on('transaction-created', function(evt) {
                            evt.data.transaction.add('flashes', flashAgent);
                        });
                    })
                    .addSetup(function(flashes) {
                        this.on('error:default', function (evt) {
                            if (evt.data.type === 'connection') {
                                flashes.add(null, 'error', 'There was an error connecting to the server. Please check your internet connection and try again.');

                            } else if (evt.data.type !== 'abort') {
                                flashes.add(null, 'error', 'There was an error processing your request. Please try again later.');

                            }
                        });
                    });
            }
        }
    });

    _context.register(PageExtension, 'PageExtension');

});
