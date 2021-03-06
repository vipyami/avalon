function scanAttr(elem, vmodels) {
    //防止setAttribute, removeAttribute时 attributes自动被同步,导致for循环出错
    var attributes = elem.hasAttributes() ? elem.attributes : []
    var bindings = [],
            msData = {},
            match
    for (var i = 0, attr; attr = attributes[i++]; ) {
        if (match = attr.name.match(rmsAttr)) {
            //如果是以指定前缀命名的
            var type = match[1]
            var param = match[2] || ""
            var value = attr.value
            var name = attr.name
            msData[name] = value
            if (events[type]) {
                param = type
                type = "on"
            }
            if (typeof bindingHandlers[type] === "function") {
                var binding = {
                    type: type,
                    param: param,
                    element: elem,
                    name: match[0],
                    value: value,
                    priority: type in priorityMap ? priorityMap[type] : type.charCodeAt(0) * 10 + (Number(param) || 0)
                }
                if (type === "html" || type === "text") {
                    var token = getToken(value)
                    avalon.mix(binding, token)
                    binding.filters = binding.filters.replace(rhasHtml, function() {
                        binding.type = "html"
                        binding.group = 1
                        return ""
                    })
                }
                if (name === "ms-if-loop") {
                    binding.priority += 100
                }
                if (vmodels.length) {
                    bindings.push(binding)
                    if (type === "widget") {
                        elem.msData = elem.msData || msData
                    }
                }
            }
        }
    }
    var control = elem.type
    if (control && msData["ms-duplex"]) {
        if (msData["ms-attr-checked"] && /radio|checkbox/.test(control)) {
            log("warning!" + control + "控件不能同时定义ms-attr-checked与ms-duplex")
        }
        if (msData["ms-attr-value"] && /text|password/.test(control)) {
            log("warning!" + control + "控件不能同时定义ms-attr-value与ms-duplex")
        }
    }
    bindings.sort(bindingSorter)
    var scanNode = true
    for (var i = 0, binding; binding = bindings[i]; i++) {
        var type = binding.type
        if (rnoscanAttrBinding.test(type)) {
            return executeBindings(bindings.slice(0, i + 1), vmodels)
        } else if (scanNode) {
            scanNode = !rnoscanNodeBinding.test(type)
        }
    }
    executeBindings(bindings, vmodels)
    if (scanNode && !stopScan[elem.tagName] && rbind.test(elem.innerHTML + elem.textContent)) {
        mergeTextNodes && mergeTextNodes(elem)
        scanNodeList(elem, vmodels) //扫描子孙元素
    }
}

var rnoscanAttrBinding = /^if|widget|repeat$/
var rnoscanNodeBinding = /^each|with|html|include$/