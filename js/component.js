class InputGroup {
    constructor(id) {
        if (new.target === InputGroup)
            throw new Error("InputGroup is abstract class");
        this.id = id;
        this.index = 0, this.items = null, this.event = null;
        this.jsonPath = null;
    }

    draw(items, event, index) {
        this._setItems(items);
        this._setEvent(event);
        if (index)
            this._setIndex(index);
        else
            this._setIndex(0);
        this.jsonPath = null; //
        return getNullPromise();
    }
    load(jsonPath, event) {
        var _this = this;
        return readJSON(jsonPath).then(items => {
            _this.draw(items, event);
            _this.jsonPath = jsonPath; //
            return this;
        }).catch({});
    }
    reload() {
        if (!this.jsonPath)
            return getNullPromise();
        return this.load(this.jsonPath, this.event);
    }
}

class Dropdown extends InputGroup {
    _setItems(items) {
        $(this.id + " .dropdown-menu").children().remove();

        var o = $(this.id + " .dropdown-menu");

        this.items = [];
        var parsed;
        for (var i = 0; i < items.length; i++) {
            parsed = parseString(items[i]);
            if (parsed) {
                if (parsed.mapped) {
                    this.items.push(parsed.mapped);
                    $("<button class='dropdown-item' type='button'>" + parsed.mapped + "</button>").appendTo(o).attr({
                        "data-toggle": "tooltip",
                        "data-placement": "left",
                        "data-original-title": parsed.unmapped
                    }).tooltip();
                } else {
                    this.items.push(parsed.unmapped);
                    o.append("<button class='dropdown-item' type='button'>" + parsed.unmapped + "</button>");
                }
            }
            else {
                o.append("<button class='dropdown-item' type='button'>" + items[i] + "</button>");
                this.items.push(items[i]);
            }
        }
    }
    _setEvent(event) {
        if (event === undefined)
            event = null;
        
        var _this = this;
        var o = $(this.id + " .dropdown-item");
        for (var i = 0; i < this.items.length; i++) {
            $(o[i]).on("click", function (_i) {
                return function (e) {
                    _this._setIndex(_i);
                    if (event)
                        event(_i);
                };
            }(i));
        }

        this.event = event;
    }
    _setIndex(index) {
        if (index >= this.items.length)
            index = this.items.length - 1;
        var o = $(this.id).find(".dropdown-toggle").text(this.items[index]);
        o.children().remove();
        var title = $(this.id).find(".dropdown-item").eq(index).attr("data-original-title");
        if (title) {
            $("<span class='tooltip-span'></span>").appendTo(o).attr({
                "data-toggle": "tooltip",
                "data-placement": "bottom",
                "data-original-title": title
            }).tooltip();
        }
        this.index = index;
        if (this.event)
            this.event(index);
    }
}

class BtnGroup extends InputGroup {
    _setItems(items) {
        $(this.id).children().remove();

        var o = $(this.id);
        for (var i in items)
            o.append("<label class='btn white-outline'><input type='radio'>" + items[i] + "</label>");
        this.items = items;
    }
    _setEvent(event) {
        if (event === undefined)
            event = null;

        var _this = this;
        var o = $(this.id + " input");
        for (var i = 0; i < this.items.length; i++) {
            $(o[i]).on("click", function (_i) {
                return function (e) {
                    _this._setIndex(_i);
                    if (event)
                        event(_i);
                };
            }(i));
        }
        this.event = event;
    }
    _setIndex(index) {
        if (index >= this.items.length)
            index = this.items.length - 1;
        $($(this.id + " label")[index]).click();
        this.index = index;
        if (this.event)
            this.event(index);
    }
}