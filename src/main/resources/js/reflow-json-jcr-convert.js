/**
 * Converts code snippets with "json-jcr" language to dual-view with a tab selection for:
 * - FileVault XML view of the snippet (derived from the JSON)
 * - original JSON view of the snippet
 */
document.querySelectorAll('div.source pre code.language-json-jcr').forEach((code) => {  
  const jsonCode = code.innerText;
  const fileVaultXmlCode = jsonToFileVaultXml(jsonCode);
  if (!fileVaultXmlCode) {
    // skip further processing if no FileVault XML code could be generated
    return;
  }

  // remove existing source DIV
  const source = code.parentElement.parentElement;
  const parent = source.parentElement;
  source.remove();

  // instead, add a tab container with both FileVault XML and JSON views
  const tabContainer = document.createElement('div');
  tabContainer.classList.add('source-tab');
  const tabSelection = document.createElement('div');
  tabSelection.classList.add('source-tab-selection');
  tabSelection.appendChild(createTabSelection('xml', 'FileVault', true));
  tabSelection.appendChild(createTabSelection('json', 'JSON'));
  tabContainer.appendChild(tabSelection);
  tabContainer.appendChild(createCodeTab('xml', fileVaultXmlCode, true));
  tabContainer.appendChild(createCodeTab('json', jsonCode));

  parent.appendChild(tabContainer);
});

function createTabSelection(language, title, active = false) {
  const tab = document.createElement('div');
  tab.innerText = title;
  tab.dataset.language = language;
  if (active) {
    tab.classList.add('active');
  }
  tab.addEventListener('click', () => {
    const tabContainer = tab.parentElement.parentElement;
    tabContainer.querySelectorAll('.source-tab-selection > div, .source').forEach((item) => {
      if (item.dataset.language === language) {
        item.classList.add('active');
      }
      else {
        item.classList.remove('active');
      }
    });
  });
  return tab;
}

function createCodeTab(language, codeText, active = false) {
  const source = document.createElement('div');
  source.classList.add('source');
  source.dataset.language = language;
  if (active) {
    source.classList.add('active');
  }
  const pre = document.createElement('pre');
  const code = document.createElement('code');
  code.classList.add(`language-${language}`);
  code.appendChild(document.createTextNode(codeText));
  pre.appendChild(code);
  source.appendChild(pre);
  return source;
}

function jsonToFileVaultXml(json) {
  let inputJson = json;
  if (inputJson.trim().startsWith('\"')) {
    inputJson = `{${inputJson}}`;
  }
  const obj = JSON.parse(inputJson);
  const childNames = getChildNames(obj);
  if (childNames.length === 0) {
    return undefined;
  }
  return objectToXmlElement(childNames[0], obj[childNames[0]], 0);
}

function objectToXmlElement(name, obj, level) {
  const attributeNames = getAttributeNames(obj);
  const childNames = getChildNames(obj);
  let xml = `${indent(level)}<${name}`;
  if (!attributeNames.includes('jcr:primaryType')) {
    xml += `\n${indent(level+1)}jcr:primaryType="nt:unstructured"`;
  }
  attributeNames.forEach((attrName) => {
    xml += `\n${indent(level+1)}${attrName}="${toValueString(obj[attrName])}"`;
  });
  if (childNames.length == 0) {
    xml += '/>';
  }
  else {
    xml += '>';
    childNames.forEach((childName) => {
      xml += `\n${objectToXmlElement(childName, obj[childName], level+1)}`;
    });
    xml += `\n${indent(level)}</${name}>`;
  }
  return xml;
}

function toValueString(value) {
  if (Array.isArray(value)) {
    const valueTypeSet = new Set();
    value.forEach((item) => {
      const valueType = getValueType(item);
      if (valueType) {
        valueTypeSet.add(valueType);
      }
    });
    if (valueTypeSet.size === 1) {
      return `{${valueTypeSet.values().next().value}}[${value}]`;
    }
    else {
      return `[${value}]`;
    }
  }
  const valueType = getValueType(value);
  if (valueType) {
    return `{${valueType}}${value}`;
  }
  return value;
}

function getValueType(value) {
  if (typeof value === 'boolean') {
    return `Boolean`;
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return `Long`;
    }
    else {
      return `Double`;
    }
  }
  return undefined;
}

function getAttributeNames(obj) {
  const result = []
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (value != null && !(typeof value === 'object' && !Array.isArray(value))) {
        result.push(key);
      }
    }
  }
  return result;
}

function getChildNames(obj) {
  const result = []
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      if (value != null && typeof value === 'object' && !Array.isArray(value)) {
        result.push(key);
      }
    }
  }
  return result;
}

function indent(level) {
  return '    '.repeat(level);
}
