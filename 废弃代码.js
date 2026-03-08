//构建多项式展开规则，并与默认规则合并
const expand = [
  { l: 'n1*(n2+n3)', r: 'n1*n2 + n1*n3' },
  { l: '(n1+n2)*n3', r: 'n1*n3 + n2*n3' },
  { l: '(n1+n2)^2', r: '(n1+n2)*(n1+n2)' },
  { l: '(n1+n2)^3', r: '(n1+n2)*(n1+n2)*(n1+n2)' },
  { l: '(n1-n2)^2', r: '(n1-n2)*(n1-n2)' },
  { l: '(n1-n2)^3', r: '(n1-n2)*(n1-n2)*(n1-n2)' },
];
const expandRules = expand.concat(math.simplify.rules);

try {
            // 使用math.simplify展开多项式
             const expanded = math.simplify(originalValue, expandRules,{},{consoleDebug: true});
            const expandedStr = math.format(expanded, { fraction: 'ratio' });

            console.log(`多项式展开: ${originalValue} -> ${expandedStr}`);

            if (expandedStr !== originalValue) {
                state.matrixData.elements[row][col] = expandedStr;
                hasChanges = true;
            }
        } catch (error) {
            console.warn(`展开失败: ${originalValue}`, error);
        }