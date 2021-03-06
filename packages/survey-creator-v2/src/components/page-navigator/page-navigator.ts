import * as ko from "knockout";
import { PopupModel } from "survey-knockout";
import { ITabItem } from '../tabbed-menu/tabbed-menu-item';

import "./page-navigator.scss";
const template = require("./page-navigator.html");
// import template from "./page-navigator.html";

export class PageNavigatorViewModel {
  private _itemsSubscription: ko.Computed;
  private _selectionSubscription: ko.Computed;
  private selectedItem = ko.observable<ITabItem>();
  constructor(_items: Array<ITabItem> | ko.Computed<Array<ITabItem>>, private _creator: any, selection?: () => ITabItem, onSelect = (item: ITabItem) => {}) {
    this._selectionSubscription = ko.computed(() => this.selectedItem(selection && selection()));
    const pageSelectorModel = this.popupModel.contentComponentData;
    this._itemsSubscription = ko.computed(() => {
      var pageSelectorItems = [];
      this.items(ko.unwrap(_items).map((_item: ITabItem) => {
          let item: ITabItem = <any>{
            name: _item.name,
            title: _creator ? _creator.getObjectDisplayName(_item) : _item.title
          };
          item.selected = _item.selected || ko.computed(() => _item === this.selectedItem());
          item.action = () => {
            this.selectedItem(_item);
            onSelect && onSelect(_item);
            _item.action && _item.action();
          };

          pageSelectorItems.push({title: item.title, value: _item});

          return item;
        })
      );
      pageSelectorModel.items(pageSelectorItems);
    });
    pageSelectorModel.selectedItem = ko.computed({
      read: () => pageSelectorModel.items().filter(item => item.value === this.selectedItem())[0],
      write: val => {}
    });
  }
  public items = ko.observableArray<ITabItem>();

  get visible() {
    return this.items().length > 1;
  }

  icon = "icon-navigation"
  
  popupModel = new PopupModel(
    "sv-list",
    {
      onItemSelect: (item) => {
        this._creator.selectElement(item.value);
        this.popupModel.toggleVisibility();
      },
      items: ko.observableArray(),
      selectedItem: undefined
    },
    undefined
  );

  togglePageSelector = () => this.popupModel.toggleVisibility();

  dispose() {
    this._selectionSubscription.dispose();
    this._itemsSubscription.dispose();
  }
}

ko.components.register("svc-page-navigator", {
  viewModel: {
    createViewModel: (params: any, componentInfo: any) => {
      const model = new PageNavigatorViewModel(
        params.items,
        params.creator,
        params.selection,
        params.onSelect
      );
      ko.utils.domNodeDisposal.addDisposeCallback(componentInfo.element, () => {
        model.dispose();
      });
      return model;
    },
  },
  template: template,
});
