const ZOOMABLELINE_MAX_SLOT = 16;
const NETWORK_ICON_DIR = "resrc/icons/vis-network/";

class Chart {
    constructor(id) {
        if (new.target === Chart) {
            this.unknown = true;
            this.structure = null;
        }
        this.id = id;
        this.input = null, this.template = null;
        this.jsonPath = null;
    }

    erase() {
        var $id = $(this.id),
            $container;
        if (!($container = $id.find(".data-container")).length && !($container = $id).hasClass("data-container"))
            throw new Error("Invalid data container");
        $container.children().remove();
    }
    draw(input, template) {
        this.input = input, this.template = template;
        this.jsonPath = null; //
        if (this.unknown) {
            delete this.structure;
            if (input.score) {
                this.structure = new Score(this.id);
                input = input["score"], template = template["score"];
            } else if (input.table) {
                this.structure = new Table(this.id);
                input = input["table"], template = template["table"];
            } else if (input.editableTable) {
                this.structure = new EditableTable(this.id);
                input = input["editableTable"], template = template["editableTable"];
            } else if (input.line) {
                this.structure = new Line(this.id);
                input = input["line"], template = template["line"];
            } else if (input.zoomableLine) {
                this.structure = new ZoomableLine(this.id);
                input = input["zoomableLine"], template = template["zoomableLine"];
            } else if (input.pie) {
                this.structure = new Pie(this.id);
                input = input["pie"], template = template["pie"];
            } else if (input.network) {
                this.structure = new Network(this.id);
                input = input["network"], template = template["network"];
            } else {
                throw new Error("Invalid input data");
            }
            return this.structure.draw(input, template);
        } else {
            this.erase();
            this._draw(input, template);
            $("[data-toggle='tooltip']").tooltip();
            return getNullPromise();
        }
    }
    load(jsonPath, template) {
        var _this = this;
        return readJSON(jsonPath).then(input => {
            _this.draw(input, template);
            _this.jsonPath = jsonPath; //
            return this;
        });
    }
    reload() {
        if (!this.jsonPath)
            return getNullPromise();
        return this.load(this.jsonPath, this.template);
    }
}

class Texts extends Chart {
    _draw(json) {
        var makePTag = function (text) {
            var parsed = parseString(text);
            if (parsed) {
                if (parsed.mapped)
                    return $("<p>" + parsed.mapped + "</p>").attr({
                        "data-toggle": "tooltip",
                        "data-placement": "bottom",
                        "title": parsed.unmapped
                    });
                else
                    return $("<p>" + parsed.unmapped + "</p>");
            } else
                return $("<p>" + text + "</p>");
        }

        var $dataset = $(this.id).find(".data-container");
        if (Array.isArray(json))
            for (var i = 0; i < $dataset.length; i++) {
                if (Array.isArray(json[i]))
                    for (var j = 0; j < json[i].length; j++) {
                        makePTag(json[i][j]).appendTo($dataset[i]);
                    }
                else {
                    makePTag(json[i]).appendTo($dataset[i]);
                }
            }
        else {
            makePTag(json).appendTo($dataset);
        }
    }
}

class Score extends Chart {
    _draw(input, template) {
        var $container = $("<div class='score-container'></div>").appendTo(this.id);
        var code = "<h1 class='score'>" + input + "</h1>"
        $container.append(code);

        for (var key in template.score) {
            switch (key) {
                case "height":
                    $container.css("min-height", template.score.height + "px");
                    break;
            }
        }

        this.input = input;
    }
}

class Table extends Chart {
    constructor(id) {
        super(id);
        this.$table = null;
        this.cols = [], this.rows = [];
    }

    _draw(input) {
        var $container = $("<div></div>").appendTo(this.id);
        $container.addClass(["table-container", "table-responsive"]);

        var code = "<table class='table table-sm table-striped'>";
        if (input.head) {
            code += "<thead>";
            code += "<tr>";
            for (var i = 0; i < input.head.length; i++)
                code += "<th>" + input.head[i] + "</th>";
            code += "</tr>";
            code += "</thead>";
        }
        code += "<tbody>";
        var text, parsed;
        for (var i = 0; i < input.body.length; i++) {
            code += "<tr>";
            for (var j = 0; j < input.body[i].length; j++) {
                parsed = parseString(text = input.body[i][j]);
                if (parsed) {
                    if (parsed.mapped)
                        code += "<td data-toggle='tooltip' data-placement='bottom' title='" + parsed.unmapped + "'><u>" + parsed.mapped + "</u></td>";
                    else
                        code += "<td>" + parsed.unmapped + "</td>";
                } else
                    code += "<td>" + text + "</td>";
            }
            code += "</tr>";
        }
        code += "</tbody>";
        code += "</table>";

        this.$table = $(code).appendTo($container);
        this.input = input;

        var temp;

        temp = this.rows, this.rows = [];
        for (var i = 0; i < input.body.length; i++)
            this.rows.push(null);

        temp = this.cols, this.cols = [];
        for (var i = 0; i < input.body[0].length; i++)
            this.cols.push(null);
        for (var i = 0; i < temp.length; i++) {
            if (temp[i]) {
                switch (temp[i].type) {
                    case "checkbox":
                        this.insertCheckboxColumn(i, temp[i]);
                        break;
                    case "radio":
                        this.insertRadioColumn(i, temp[i]);
                        break;
                    case "textfield":
                        this.setTextfieldColumn(i, temp[i]);
                }
            }
        }
    }

    insertColumn(index) {
        index = parseIndex(index, this.cols.length);

        if (this.$table) {
            var $th, $td;
            if (index === this.cols.length) {
                $th = $("<th></th>").appendTo(this.$table.find("thead tr"));
                $td = $("<td></td>").appendTo(this.$table.find("tbody tr"));
            } else {
                $th = $("<th></th>").insertBefore(this.$table.find("thead th:nth-child(" + (index + 1) + ")"));
                $td = $("<td></td>").insertBefore(this.$table.find("tbody td:nth-child(" + (index + 1) + ")"));
            }
        }
        this.cols.splice(index, 0, undefined);
        return [$th, $td];
    }
    deleteColumn(index) {
        index = parseIndex(index, this.cols.length);

        if (this.$table) {
            this.$table.find("thead th:nth-child(" + (index + 1) + ")").remove();
            this.$table.find("tbody td:nth-child(" + (index + 1) + ")").remove();
        }
        this.cols.splice(index, 1);
    }

    insertRow(index) {
        index = parseIndex(index, this.rows.length);

        var $tr;
        if (index === this.rows.length)
            $tr = $("<tr></tr>").appendTo(this.$table.find("tbody"));
        else
            $tr = $("<tr></tr>").insertBefore(this.$table.find("tbody tr").eq(index));
        for (var i = 0; i < this.cols.length; i++)
            $tr.append("<td></td>");
        this.rows.splice(index, 0, undefined);

        var checkedIndices, $forms, code;
        for (var i = 0; i < this.cols.length; i++) {
            if (this.cols[i]) {
                switch (this.cols[i].type) {
                    case "checkbox":
                        checkedIndices = this.getCheckboxIndices(i);
                        this._setCheckboxColumn(i, this.cols[i]);
                        $forms = this.$table.find("input[name='" + this.cols[i].name + "']");
                        for (var j = 0; j < checkedIndices.length; j++)
                            $forms.eq(checkedIndices[j]).prop("checked", true);
                        this._refreshParentCheckbox(this.cols[i].name);
                        break;
                    case "radio":
                        checkedIndices = this.getRadioIndex(i);
                        this._setRadioColumn(i, this.cols[i]);
                        $forms = this.$table.find("input[name='" + this.cols[i].name + "']");
                        $forms.eq(checkedIndices).prop("checked", true);
                        break;
                    case "textfield":
                        code = "<input type='text' class='outlined purple text-center' placeholder='" + this.cols[i].placeholder + "'></input>";
                        $(code).appendTo($tr.find("td").eq(i)).on("click", e => e.stopPropagation());
                        break;
                }
            }
        }

        // scroll 맨 아래로
        var div = document.querySelector(this.id + ">.table-container");
        div.scrollTop = div.scrollHeight;

        return $tr;
    }

    deleteRow(index) {
        index = parseIndex(index, this.rows.length);

        this.$table.find("tbody tr").eq(index).remove();
        this.rows.splice(index, 1);

        for (var i = 0; i < this.cols.length; i++) {
            if (this.cols[i]) {
                switch (this.cols[i].type) {
                    case "checkbox":
                        this._refreshParentCheckbox(this.cols[i].name);
                        break;
                }
            }
        }
    }
    deleteCheckedRows(checkboxName) {
        var $checkedRows = this.$table.find("input[name='" + checkboxName + "']:checked");
        for (var i = 0; i < $checkedRows.length; i++)
            this.deleteRow($checkedRows.eq(i).parent().parent().parent().index());
    }

    // textfield
    insertTextfieldColumn(index, options) {
        this.insertColumn(index);
        this.setTextfieldColumn(index, options);
    }
    setTextfieldColumn(index, {
        headContent,
        placeholder
    }) {
        if (!placeholder)
            placeholder = "빈 필드";
        code = "<input type='text' class='outlined purple text-center' placeholder='" + placeholder + "'></input>";

        var code, $td, text;
        if (headContent) {
            $td = this.$table.find("thead th:nth-child(" + (index + 1) + ")");
            if (headContent === true)
                for (var i = 0; i < $td.length; i++) {
                    if ($td.find("input[type='text']").length)
                        continue;
                    text = $td.text();
                    $td.text("");
                    $(code).appendTo($td).val(text).on("click", e => e.stopPropagation());
                }
            else
                $td.text(headContent);
        }

        $td = this.$table.find("tbody td:nth-child(" + (index + 1) + ")");
        for (var i = 0; i < $td.length; i++) {
            if ($td.eq(i).find("input[type='text']").length)
                continue;
            text = $td.eq(i).text();
            $td.eq(i).text("");
            $(code).appendTo($td.eq(i)).val(text).on("click", e => e.stopPropagation());
        }

        this.cols[index] = {
            type: "textfield",
            headContent: headContent,
            placeholder: placeholder
        };
    }

    // radio, checkbox
    insertRadioColumn(index, options) {
        this.insertColumn(index);
        this._setRadioColumn(index, options);
    }
    insertCheckboxColumn(index, options) {
        this.insertColumn(index);
        this._setCheckboxColumn(index, options);
    }
    _setRadioColumn(index, {
        name,
        headContent,
        onclick,
        rowClick
    }) {
        if (!name)
            name = this.id.substring(1) + "-radio" + getRandomInt(1000);

        if (this.$table) {
            var $th = this.$table.find("thead th:nth-child(" + (index + 1) + ")"),
                $td = this.$table.find("tbody td:nth-child(" + (index + 1) + ")");
            $th.text(""), $th.children().remove();
            $td.text(""), $td.children().remove();

            var code = "<div class='form-check'>" +
                "<input class='form-check-input' type='radio'>" +
                "<label class='form-check-label'></label>" +
                "</div>";
            $th.append(headContent);
            var $radios = $td.append(code).find("input");
            $radios.attr("name", name);

            this._setRadioEvent($radios, name, {
                onclick: onclick,
                rowClick: rowClick
            });
        }

        this.cols[index] = {
            type: "radio",
            name: name,
            headContent: headContent,
            onclick: onclick,
            rowClick: rowClick
        };
    }
    _setCheckboxColumn(index, {
        name,
        onclick,
        rowClick
    }) {
        if (!name)
            name = this.id.substring(1) + "-checkbox" + getRandomInt(1000);

        if (this.$table) {
            var $th = this.$table.find("thead th:nth-child(" + (index + 1) + ")"),
                $td = this.$table.find("tbody td:nth-child(" + (index + 1) + ")");
            $th.text(""), $th.children().remove();
            $td.text(""), $td.children().remove();

            var code = "<div class='form-check'>" +
                "<input class='form-check-input' type='checkbox'>" +
                "<label class='form-check-label'></label>" +
                "</div>";
            var $parent = $th.append(code).find("input"),
                $children = $td.append(code).find("input");
            $parent.attr("name", name + "-parent"), $children.attr("name", name);

            this._setCheckboxEvent($parent, $children, name, {
                onclick: onclick,
                rowClick: rowClick
            });
        }

        this.cols[index] = {
            type: "checkbox",
            name: name,
            onclick: onclick,
            rowClick: rowClick
        };
    }
    _setRadioEvent($radios, name, {
        onclick,
        rowClick
    }) {
        var _this = this,
            $temp;

        $radios.off();
        for (var i = 0; i < this.rows.length; i++)
            ($temp = $radios.eq(i)).on("click", function ($this) {
                return e => {
                    e.stopPropagation();

                    var $row = $this.parent().parent().parent(),
                        $prevCheckedRow = _this.$table.find("input[name='" + name + "']:checked").parent().parent().parent();
                    var index = $row.index();
                    if (index === $prevCheckedRow.index())
                        return;
                    if (rowClick)
                        $prevCheckedRow.removeClass("focus"), $row.addClass("focus");
                    if (onclick)
                        onclick(index);
                };
            }($temp));
        $radios.eq(0).prop("checked", true);

        if (rowClick) {
            var $rows = this.$table.find("tbody tr");
            $rows.off();
            for (var i = 0; i < this.rows.length; i++)
                ($temp = $rows.eq(i)).on("click", function ($this) {
                    return e => {
                        var $row = $this,
                            $prevCheckedRow = _this.$table.find("input[name='" + name + "']:checked").parent().parent().parent();
                        var index = $row.index();
                        if (index === $prevCheckedRow.index())
                            return;
                        _this.$table.find("input[name='" + name + "']").eq(index).prop("checked", true); //
                        $prevCheckedRow.removeClass("focus"), $row.addClass("focus");
                        if (onclick)
                            onclick(index);
                    }
                }($temp));
            $rows.eq(0).addClass("focus");
        }
    }
    _setCheckboxEvent($parent, $children, name, {
        onclick,
        rowClick
    }) {
        var _this = this,
            $temp;

        $parent.off(), $children.off();
        $parent.on("click", e => {
            e.stopPropagation();

            _this.$table.find("input[name='" + name + "']").prop("checked", $parent.prop("checked"));
            if (rowClick) {
                if ($parent.prop("checked"))
                    _this.$table.find("tbody tr").addClass("focus");
                else
                    _this.$table.find("tbody tr").removeClass("focus");
            }
        });
        for (var i = 0; i < this.rows.length; i++)
            ($temp = $children.eq(i)).on("click", function ($this) {
                return e => {
                    e.stopPropagation();

                    var $row = $this.parent().parent().parent();
                    var index = $row.index();
                    if (rowClick)
                        $row.toggleClass("focus");
                    if (onclick)
                        onclick(index);
                    _this._refreshParentCheckbox(name);
                };
            }($temp));

        if (rowClick) {
            var $rows;
            $rows = this.$table.find("thead tr");
            $rows.off();
            $rows.on("click", e => {
                $parent.prop("checked", !$parent.prop("checked")), $parent.prop("indeterminate", false);
                _this.$table.find("input[name='" + name + "']").prop("checked", $parent.prop("checked"));
                if ($parent.prop("checked"))
                    _this.$table.find("tbody tr").addClass("focus");
                else
                    _this.$table.find("tbody tr").removeClass("focus");
            });

            $rows = this.$table.find("tbody tr");
            $rows.off();
            for (var i = 0; i < this.rows.length; i++)
                ($temp = $rows.eq(i)).on("click", function ($this) {
                    return e => {
                        var $row = $this;
                        var index = $row.index();
                        ($temp = _this.$table.find("input[name='" + name + "']").eq(index)).prop("checked", !$temp.prop("checked"));
                        $row.toggleClass("focus");
                        if (onclick)
                            onclick(index);
                        _this._refreshParentCheckbox(name);
                    };
                }($temp));
        }
    }
    _refreshParentCheckbox(name) {
        var $parent = this.$table.find("thead input[name='" + name + "-parent']"),
            $children = this.$table.find("tbody input[name='" + name + "']"),
            $checkedChildren = this.$table.find("tbody input[name='" + name + "']:checked");
        $parent.prop("checked", $checkedChildren.length > 0 && $checkedChildren.length == $children.length);
        $parent.prop("indeterminate", $checkedChildren.length > 0 && $checkedChildren.length < $children.length);
    };
    getRadioIndex(colIndex) {
        return this.$table.find("input[name='" + this.cols[colIndex].name + "']:checked").parent().parent().parent().index();
    }
    getCheckboxIndices(colIndex) {
        var arr = [];
        var $checkedChildren = this.$table.find("input[name='" + this.cols[colIndex].name + "']:checked");
        for (var i = 0; i < $checkedChildren.length; i++)
            arr.push($checkedChildren.eq(i).parent().parent().parent().index());
        return arr;
    }

    export () {
        var content = {};
        var tr, td, text;
        td = this.$table.find("thead tr").eq(0).children();
        content.head = [];
        for (var j = 0; j < td.length; j++) {
            if (this.cols[j])
                switch (this.cols[j].type) {
                    case "checkbox":
                    case "radio":
                        break;
                    case "textfield":
                        if (this.cols[j].headContent === true) {
                            text = td.eq(j).find("input").val();
                            if (text === "")
                                throw new Error("빈 필드가 있습니다.");
                            else
                                content.head.push(text);
                        } else
                            content.head.push(td.eq(j).text());
                        break;
                }
            else
                content.head.push(td.eq(j).text());
        }
        tr = this.$table.find("tbody tr");
        content.body = [];
        for (var i = 0; i < tr.length; i++) {
            content.body.push([]);
            td = tr.eq(i).children();
            for (var j = 0; j < td.length; j++) {
                if (this.cols[j]) {
                    switch (this.cols[j].type) {
                        case "checkbox":
                        case "radio":
                            break;
                        case "textfield":
                            text = td.eq(j).find("input").val();
                            if (text === "")
                                throw new Error("빈 필드가 있습니다.");
                            else
                                content.body[i].push(text);
                            break;
                    }
                } else
                    content.body[i].push(td.eq(j).text());
            }
        }
        return content;
    }
}

class EditableTable extends Table {
    constructor(id, {
        addBtnId,
        deleteBtnId
    }) {
        super(id);
        this.addBtnId = addBtnId, this.deleteBtnId = deleteBtnId;

        var _this = this;

        if (addBtnId)
            $(addBtnId).on("click", e => _this.insertRow(this.rows.length));
        if (deleteBtnId)
            $(deleteBtnId).on("click", e => _this.deleteCheckedRows(_this.checkboxName));

        this.insertCheckboxColumn(0, {
            rowClick: true
        });
        this.checkboxName = this.cols[0].name;
    }

    _draw(input) {
        super._draw(input);

        for (var i = 0; i < this.cols.length; i++)
            if (this.cols[i] === null)
                this.setTextfieldColumn(i, {});
    }
}

class C3 extends Chart {
    constructor(id) {
        super(id);
        if (new.target === C3)
            throw new Error("C3 is abstract class");
        this.chart = null;

        // mapping ip
        this._unmap = null;
    }

    _mapKey(input) {
        var data = input.data ? input.data : input;

        var unmap = {};
        var parsed, nickname;

        for (var key in data) {
            parsed = parseString(key);
            if (parsed) {
                if (nickname = parsed.mapped) {
                    if (data[nickname]) {
                        if (Array.isArray(data[nickname])) // line chart
                            for (var i = 0; i < data[nickname].length; i++)
                                data[nickname][i] += data[key][i];
                        else // pie chart
                            data[nickname] += data[key];
                        unmap[nickname] += "<p>" + parsed.unmapped + "</p>";
                    } else {
                        data[nickname] = data[key];
                        unmap[nickname] = "<p>" + parsed.unmapped + "</p>";
                    }
                } else {
                    data[parsed.unmapped] = data[key];
                }
                delete data[key];
            }
        }
        this._unmap = unmap;
    }
    _setMapTooltip(position) {
        if (!position)
            position = "top";
        var attrs;
        for (var key in this._unmap) {
            attrs = {
                "data-toggle": "tooltip",
                "data-placement": position,
                "data-html": true,
            };
            switch (position) {
                case "left":
                    attrs["title"] = "<div class='text-right'>" + this._unmap[key] + "</div>"
                    break;
                case "right":
                    attrs["title"] = "<div class='text-left'>" + this._unmap[key] + "</div>"
                    break;
                default:
                    attrs["title"] = "<div>" + this._unmap[key] + "</div>"
            }

            key = key.replace(/\s/gi, "-"); // 정규식 : 모든 공백을 -로 변경
            $(this.chart.element).find("[class~='c3-legend-item-" + key + "']").attr(attrs);
        }
    }
}

class Line extends C3 {
    _draw(input, template) {
        this._mapKey(input); // mapping ip
        var options = this._getOptions(input, template);

        this.input = input;
        this.chart = c3.generate(options);

        this._setMapTooltip(); // mapping ip
    }
    _getOptions(input, template) {
        var options = this._getDefaultOptions();
        options = objcat(options, template.options);

        options.data.columns = [];
        for (var key in input.data)
            options.data.columns.push([].concat(key, input.data[key]));
        if (input.x) {
            options.data.columns.push([].concat("x", input.x));
            options.data.x = "x";
        }
        if (input.threshold) {
            options.regions = [{
                axis: "y",
                start: input.threshold,
                class: "threshold" // .c3-region.threshold
            }];
        }

        for (var key in template.line) {
            switch (key) {
                case "stacked":
                    options.data.groups = [];
                    options.data.groups[0] = [];
                    for (var key in input.data)
                        options.data.groups[0].push(key);
                    break;
                case "xFormat":
                    options.data.xFormat = "%Y-%m-%d %H:%M:%S"; // "%Y-%m-%dT%H:%M:%S.%LZ"
                    options.axis.x = {
                        type: "timeseries",
                        tick: {
                            format: template.line.xFormat
                        }
                    };
                    break;
            }
        }
        return options;
    }
    _getDefaultOptions() {
        $("<div class='c3-container line'>").appendTo(this.id).addClass(["mx-3", "my-4"]);

        return {
            bindto: this.id + ">.c3-container",
            data: {
                type: "bar"
            },
            axis: {},
            legend: {
                show: true,
            },
            tooltip: {},
            color: {
                pattern: ["#5c6bc0"]
            },
            grid: {
                x: {
                    show: true
                },
                y: {
                    show: true
                }
            },
            padding: {
                right: 20
            }
        };
    }
}
class ZoomableLine extends Line {
    constructor(id) {
        super(id);
        this.range = null;
        this._prevRange = [];
    }

    _draw(input, template) {
        this._mapKey(input);

        this.input = input, this.template = template;

        var options = this._getOptions({}, this.template);
        options.data.x = "x";

        options.tooltip.format = {
            title: function (_this) {
                return d => {
                    var upper;
                    if ((upper = d + _this.classInterval) >= _this.range[1])
                        upper = _this.range[1];
                    if (d != upper - 1)
                        return d + " - " + (upper - 1);
                    else
                        return d;
                };
            }(this)
        };
        options.data.onclick = function (_this) {
            return (d, element) => {
                if (_this.classInterval != 1) {
                    _this._prevRange.push(_this.range);
                    _this.zoom([d.x, d.x + _this.classInterval]);
                };
            };
        }(this);

        this.chart = c3.generate(options);
        this._setMapTooltip();

        // zoom menu
        var zoomMenu = $("<div class='zoom-menu'></div>");
        var zoomLeft = $("<div></div>");
        zoomLeft.append("<button type='button' class='tooltip-btn white' data-toggle='tooltip' data-placement='left' title='막대를 눌러 확대할 수 있습니다.'></button>");
        zoomLeft.append("<p class='zoom-interval'></p>");
        zoomLeft.appendTo(zoomMenu);
        $("<button type='button' class='zoom-btn float-btn-purple'></button>").appendTo(zoomMenu).on("click", e => {
            if (this._prevRange.length !== 0)
                this.zoom(this._prevRange.pop());
        });
        zoomMenu.appendTo(this.chart.element);

        this.zoom();
    }
    zoom(range) {
        if (!range)
            range = this.input.range; // [0, 65536]

        var classInterval = Math.ceil((range[1] - range[0]) / ZOOMABLELINE_MAX_SLOT);

        var input = this.input,
            histogram = {
                x: [],
                data: {}
            };

        var input = this.input,
            histogram = {};

        // initialization
        //   : x-axis
        histogram.x = [];
        for (var lower = range[0]; lower < range[1]; lower += classInterval)
            histogram.x.push(lower);
        //   : data
        histogram.data = {};
        for (var key in input.data) {
            histogram.data[key] = [];
            for (var i = 0; i < histogram.x.length; i++)
                histogram.data[key].push(0);
        }
        // filtering
        var pos;
        for (var i = 0; i < input.x.length; i++) {
            if (input.x[i] < range[0] || range[1] <= input.x[i])
                continue;
            pos = parseInt((input.x[i] - range[0]) / classInterval);
            for (var key in input.data)
                histogram.data[key][pos] += input.data[key][i];
        }

        // conversion and load
        var columns = [];
        columns.push([].concat("x", histogram.x));
        for (var key in histogram.data)
            columns.push([].concat(key, histogram.data[key]));
        this.chart.load({
            columns: columns
        });

        $(this.chart.element).find(".zoom-interval").text("").append("<b>" + range[0] + " - " + (range[1] - 1) + "</b> &nbsp;&nbsp;|&nbsp;&nbsp; Interval : " + classInterval);
        if (this._prevRange.length === 0)
            $(this.chart.element).find(".zoom-btn").css({
                "visibility": "hidden",
                "width": 0,
                "margin-left": 0
            });
        else
            $(this.chart.element).find(".zoom-btn").css({
                "visibility": "visible",
                "width": "40px",
                "margin-left": "8px"
            });

        this.range = range, this.classInterval = classInterval;
    }
}

class Pie extends C3 {
    _draw(input, template) {
        this._mapKey(input); // mapping ip
        var options = this._getDefaultOptions();
        options = objcat(options, template.options);

        options.data.columns = [];
        for (var key in input)
            options.data.columns.push([].concat(key, input[key]));

        this.input = input;
        this.chart = c3.generate(options);

        this._setMapTooltip("left"); // mapping ip
    }
    _getDefaultOptions() {
        $("<div class='c3-container pie'>").appendTo(this.id).addClass(["mx-3", "my-4"]);

        var _this = this;
        return {
            bindto: this.id + ">.c3-container",
            data: {
                type: "donut",
                onmouseover: function (d, i) {
                    var $arcsTitle = $(_this.chart.element).find(".c3-chart-arcs-title");
                    $arcsTitle.text((d["ratio"] * 100).toFixed(1) + "%");
                    $arcsTitle.css("fill", $(i).css("fill"));
                },
                onmouseout: function (d, i) {
                    var $arcsTitle = $(_this.chart.element).find(".c3-chart-arcs-title");
                    $arcsTitle.text("");
                }
            },
            tooltip: {
                show: false
            },
            color: {
                pattern: ["#ef5350", "#ba68c8", "#7986cb", "#4db6ac", "#ffca28", "#ff8a65", "#90a4ae", "#8d6e63", "#8bc34a", "#64b5f6"]
                // red, purple, indigo, cyan, yellow, orange, gray, brown, green, blue
            },
            legend: {
                position: "right",
                item: {
                    onmouseover: function (id) {
                        var chart = _this.chart,
                            $arcsTitle = $(chart.element).find(".c3-chart-arcs-title");
                        chart.focus(id);
                        var data = chart.data();
                        var numerator = chart.data(id)[0]["values"][0]["value"],
                            denominator = 0;
                        for (var i = 0; i < data.length; i++)
                            denominator += data[i]["values"][0]["value"];
                        $arcsTitle.text((numerator / denominator * 100).toFixed(1) + "%");
                        $arcsTitle.css("fill", chart.color(id));
                    },
                    onmouseout: function (id) {
                        var chart = _this.chart,
                            $arcsTitle = $(chart.element).find(".c3-chart-arcs-title");
                        chart.revert();
                        $arcsTitle.text("");
                    },
                    onclick: function (id) {}
                }
            },
            donut: {
                width: 24,
                title: "",
                label: {
                    show: false
                }
            }
        };
    }
}

class Network extends Chart {
    constructor(id) {
        super(id);
        this.network = null;
    }

    _draw(data, template) {
        var options = this._getDefaultOptions();
        options = objcat(options, template.options);

        var nodes = [],
            edges = [];
        var o, ip, nickname;
        for (var i = 0; i < data.nodes.length; i++) {
            o = {
                id: i,
                image: NETWORK_ICON_DIR + "desktop.svg",
                shape: "circularImage"
            };
            if (Array.isArray(data.nodes[i])) {
                ip = data.nodes[i][0];
                // desktop, hub, internet, laptop, phone, printer, server
                o.image = NETWORK_ICON_DIR + data.nodes[i][1] + ".svg";
            } else {
                ip = data.nodes[i];
            }
            var parsed = parseString(ip);
            if (parsed) {
                if (parsed.mapped) {
                    o.label = parsed.mapped;
                    o.title = parsed.unmapped;
                } else {
                    o.label = parsed.unmapped;
                }
            } else {
                o.label = ip;
            }
            nodes.push(o);
        }
        for (var i = 0; i < data.edges.length; i++)
            edges.push({
                id: i,
                from: data.edges[i][0],
                to: data.edges[i][1]
            });

        this.data = data;
        this.network = new vis.Network(document.querySelector(this.id), {
            nodes: nodes,
            edges: edges
        }, options);

        this._limitViewPosition();

        /*var _this = this;
        this.network.on("click", param => {
            if (param.nodes.length)
                console.log(param.nodes[0]);
            else if (param.edges.length)
                console.log(_this.data.edges[param.edges[0]]);
        });*/
    }
    _limitViewPosition() {
        var network = this.network;

        var $canvas = $(this.id).find("canvas");
        var canvasWidth = $canvas.attr("width"),
            canvasHeight = $canvas.attr("height");
        var defaultScale = network.getScale();
        var defaultHalfWidth = 0.5 * canvasWidth / defaultScale,
            defaultHalfHeight = 0.5 * canvasHeight / defaultScale;

        var prevNodePos;
        network.on("dragStart", param => {
            if (param.nodes.length)
                prevNodePos = network.getPositions(param.nodes);
        });
        network.on("dragEnd", param => {
            var center = network.getViewPosition(),
                scale = network.getScale();
            var dx = defaultHalfWidth - 0.5 * canvasWidth / scale,
                dy = defaultHalfHeight - 0.5 * canvasHeight / scale;

            var isMoved;
            if (center.x <= -dx)
                center.x = -dx, isMoved = true;
            else if (center.x >= dx)
                center.x = dx, isMoved = true;
            if (center.y <= -dy)
                center.y = -dy, isMoved = true;
            else if (center.y >= dy)
                center.y = dy, isMoved = true;
            if (isMoved) {
                network.moveTo({
                    position: center
                });
            }

            var pos = network.getPositions(param.nodes);
            for (var key in pos)
                if (Math.abs(pos[key].x) >= defaultHalfWidth / 2 || Math.abs(pos[key].y) >= defaultHalfHeight / 2) // 왜 / 2?
                    network.moveNode(key, prevNodePos[key].x, prevNodePos[key].y);
        });
        network.on("zoom", param => {
            if (network.getScale() <= defaultScale)
                network.moveTo({
                    position: {
                        x: 0,
                        y: 0
                    },
                    scale: defaultScale
                });
        });
    }

    _getDefaultOptions() {
        return {
            nodes: {
                borderWidth: 0,
                size: 30,
                color: {
                    border: "#5c6bc0",
                    background: "#5c6bc0",
                    highlight: {
                        border: "#8e99f3",
                        background: "#8e99f3"
                    }
                },
                font: "14px RobotoCondensed lightgray"
            },
            edges: {
                color: "#5c6bc0",
                smooth: {
                    enabled: false
                }
            },
            physics: {
                enabled: false
            },
            interaction: {
                dragNodes: true,
                tooltipDelay: 0
            },
            layout: {
                hierarchical: {
                    direction: "UD",
                    sortMethod: "directed"
                }
            }
        };
    }
}