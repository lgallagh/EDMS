/**
 * Generates details for an audit entry, with the old and new data objects, and a list of fields that count as keys
 * @param {*} oldData 
 * @param {*} newData 
 * @param {*} keyList 
 * @returns String
 */
function diffData(oldData, newData, keyList = []) {
  const oldIsNull = oldData == null;
  const newIsNull = newData == null;

  // For recursion, fall back undefined → {} or []
  const oldObj = oldIsNull ? {} : oldData;
  const newObj = newIsNull ? {} : newData;

  let out = '---Keys\n';
  keyList.forEach((key) => {
    // prefer newData for key display, else oldData
    const displayVal = newIsNull
      ? oldObj[key]
      : newObj[key] != null
        ? newObj[key]
        : oldObj[key];
    out += `${key} : ${formatValue(displayVal)}\n`;
  });

  out += '\n---Fields\n';
  const diffs = [];

  function recurse(prefix, a, b) {
    // both are primitive-ish
    if (!isObject(a) && !Array.isArray(a) && !isObject(b) && !Array.isArray(b)) {
      if (!isEqual(a, b)) {
        //If old or new are completely null, this was an add or delete, and we should only show one set of data
        if (!oldIsNull) diffs.push(`${prefix} [old]: ${formatValue(a)}`);
        if (!newIsNull) diffs.push(`${prefix} [new]: ${formatValue(b)}`);
      }
      return;
    }

    // handle arrays
    if (Array.isArray(a) || Array.isArray(b)) {
      const arrA = Array.isArray(a) ? a : [];
      const arrB = Array.isArray(b) ? b : [];
      const maxLen = Math.max(arrA.length, arrB.length);
      for (let i = 0; i < maxLen; i++) {
        recurse(`${prefix}[${i}]`, arrA[i], arrB[i]);
      }
      return;
    }

    // handle objects
    const allKeys = new Set([
      ...Object.keys(a || {}),
      ...Object.keys(b || {})
    ]);
    for (const k of allKeys) {
      // skip primary keys at the top level
      if (prefix === '' && keyList.includes(k)) {
        continue;
      }
      const newPrefix = prefix ? `${prefix}.${k}` : k;
      recurse(newPrefix, a?.[k], b?.[k]);
    }
  }

  recurse('', oldObj, newObj);

  if (diffs.length === 0) {
    out += '(no changes)\n';
  } else {
    out += diffs.join('\n') + '\n';
  }

  return out;
}

function isObject(val) {
  return val && typeof val === 'object' && !Array.isArray(val);
}

function isEqual(a, b) {
  // treat both nullish as equal
  if (a == null && b == null) return true;
  return a === b;
}

function formatValue(val) {
  if (val == null) return '';
  if (typeof val === 'object') {
    // for arrays or nested objects
    return JSON.stringify(val);
  }
  return String(val);
}

module.exports = { diffData };
