import modules from './ui.grid_core.modules';
import Pager from '../pager';
import { isDefined } from '../../core/utils/type';
import { hasWindow } from '../../core/utils/window';
import messageLocalization from '../../localization/message';

const PAGER_CLASS = 'pager';
const MAX_PAGES_COUNT = 10;

const getPageIndex = function(dataController) {
    return 1 + (parseInt(dataController.pageIndex()) || 0);
};

const PagerView = modules.View.inherit({
    init: function() {
        const dataController = this.getController('data');

        dataController.changed.add((e) => {
            if(e && e.repaintChangesOnly) {
                const pager = this._pager;
                if(pager) {
                    pager.option({
                        pageIndex: getPageIndex(dataController),
                        pageSize: dataController.pageSize(),
                        pageCount: dataController.pageCount(),
                        totalCount: dataController.totalCount(),
                        hasKnownLastPage: dataController.hasKnownLastPage()
                    });
                } else {
                    this.render();
                }
            } else if(!e || e.changeType !== 'update' && e.changeType !== 'updateSelection' && e.changeType !== 'updateFocusedRow') {
                this._pager = null;
                this.render();
            }
        });
    },

    _renderCore: function() {
        const that = this;
        const $element = that.element().addClass(that.addWidgetPrefix(PAGER_CLASS));
        const pagerOptions = that.option('pager') || {};
        const dataController = that.getController('data');
        const keyboardController = that.getController('keyboardNavigation');
        const options = {
            maxPagesCount: MAX_PAGES_COUNT,
            pageIndex: getPageIndex(dataController),
            pageCount: dataController.pageCount(),
            pageSize: dataController.pageSize(),
            showPageSizes: pagerOptions.showPageSizeSelector,
            showInfo: pagerOptions.showInfo,
            displayMode: pagerOptions.displayMode,
            pagesNavigatorVisible: pagerOptions.visible,
            showNavigationButtons: pagerOptions.showNavigationButtons,
            label: pagerOptions.label,
            pageSizes: that.getPageSizes(),
            totalCount: dataController.totalCount(),
            hasKnownLastPage: dataController.hasKnownLastPage(),
            pageIndexChanged: function(pageIndex) {
                if(dataController.pageIndex() !== pageIndex - 1) {
                    dataController.pageIndex(pageIndex - 1);
                }
            },
            pageSizeChanged: function(pageSize) {
                dataController.pageSize(pageSize);
            },
            onKeyDown: e => keyboardController && keyboardController.executeAction('onKeyDown', e),
            useLegacyKeyboardNavigation: this.option('useLegacyKeyboardNavigation'),
            useKeyboard: this.option('keyboardNavigation.enabled')
        };

        if(isDefined(pagerOptions.infoText)) {
            options.infoText = pagerOptions.infoText;
        }

        if(this._pager) {
            this._pager.repaint();
            return;
        }

        if(hasWindow()) {
            this._pager = that._createComponent($element, Pager, options);
        } else {
            $element
                .addClass('dx-pager')
                .html('<div class="dx-pages"><div class="dx-page"></div></div>');
        }
    },

    getPager: function() {
        return this._pager;
    },

    getPageSizes: function() {
        const that = this;
        const dataController = that.getController('data');
        const pagerOptions = that.option('pager');
        const allowedPageSizes = pagerOptions && pagerOptions.allowedPageSizes;
        const pageSize = dataController.pageSize();

        if(!isDefined(that._pageSizes) || !that._pageSizes.includes(pageSize)) {
            that._pageSizes = [];
            if(pagerOptions) {
                if(Array.isArray(allowedPageSizes)) {
                    that._pageSizes = allowedPageSizes;
                } else if(allowedPageSizes && pageSize > 1) {
                    that._pageSizes = [Math.floor(pageSize / 2), pageSize, pageSize * 2];
                }
            }
        }
        return that._pageSizes;
    },

    isVisible: function() {
        const dataController = this.getController('data');
        const pagerOptions = this.option('pager');
        let pagerVisible = pagerOptions && pagerOptions.visible;
        const scrolling = this.option('scrolling');

        if(pagerVisible === 'auto') {
            if(scrolling && (scrolling.mode === 'virtual' || scrolling.mode === 'infinite')) {
                pagerVisible = false;
            } else {
                pagerVisible = dataController.pageCount() > 1 || (dataController.isLoaded() && !dataController.hasKnownLastPage());
            }
        }
        return pagerVisible;
    },

    getHeight: function() {
        return this.getElementHeight();
    },

    optionChanged: function(args) {
        const name = args.name;
        const isPager = name === 'pager';
        const isPaging = name === 'paging';
        const isDataSource = name === 'dataSource';
        const isScrolling = name === 'scrolling';
        const dataController = this.getController('data');

        if(isPager || isPaging || isScrolling || isDataSource) {
            args.handled = true;

            if(dataController.skipProcessingPagingChange(args.fullName)) {
                return;
            }

            if(isPager || isPaging) {
                this._pageSizes = null;
            }

            if(!isDataSource) {
                this._pager = null;
                this._invalidate();
                if(hasWindow() && isPager && this.component) {
                    this.component.resize();
                }
            }
        }
    },

    dispose: function() {
        this._pager = null;
    }
});

export const pagerModule = {
    defaultOptions: function() {
        return {
            pager: {
                visible: 'auto',
                showPageSizeSelector: false,
                allowedPageSizes: 'auto',
                label: messageLocalization.format('dxPager-ariaLabel')
            }
        };
    },
    views: {
        pagerView: PagerView
    }
};
