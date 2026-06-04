const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

function getOldSwagger() {
  try {
    const stdout = execSync('git show HEAD:"swagger (2).json"', { maxBuffer: 10 * 1024 * 1024 });
    return JSON.parse(stdout.toString('utf8'));
  } catch (error) {
    console.error('Error reading HEAD:swagger (2).json. Trying to find it in git log...', error.message);
    throw error;
  }
}

function getNewSwagger() {
  const filePath = path.join(__dirname, '../swagger (2).json');
  const content = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(content);
}

function deepCompare(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

function getRefName(ref) {
  if (!ref) return '';
  return ref.split('/').pop();
}

function resolveSchemaString(schema) {
  if (!schema) return 'None';
  if (schema.$ref) return `Model \`${getRefName(schema.$ref)}\``;
  if (schema.type === 'array') {
    return `Array of ${resolveSchemaString(schema.items)}`;
  }
  let str = schema.type || 'object';
  if (schema.format) str += ` (${schema.format})`;
  if (schema.nullable) str += ' | null';
  return str;
}

function compareSchemas(oldSchemas, newSchemas) {
  const newSchemaKeys = Object.keys(newSchemas);
  const oldSchemaKeys = Object.keys(oldSchemas);

  // New Schemas
  const addedSchemas = newSchemaKeys.filter(k => !oldSchemas[k]);
  // Deleted Schemas
  const deletedSchemas = oldSchemaKeys.filter(k => !newSchemas[k]);
  // Common Schemas to compare
  const commonSchemas = newSchemaKeys.filter(k => oldSchemas[k]);

  const modifiedSchemas = [];

  for (const key of commonSchemas) {
    const oldS = oldSchemas[key];
    const newS = newSchemas[key];

    // Compare properties
    const oldProps = oldS.properties || {};
    const newProps = newS.properties || {};

    const oldPropKeys = Object.keys(oldProps);
    const newPropKeys = Object.keys(newProps);

    const addedProps = newPropKeys.filter(p => !oldProps[p]);
    const deletedProps = oldPropKeys.filter(p => !newProps[p]);
    const commonProps = newPropKeys.filter(p => oldProps[p]);

    const changedProps = [];
    for (const prop of commonProps) {
      const oldP = oldProps[prop];
      const newP = newProps[prop];

      if (!deepCompare(oldP, newP)) {
        changedProps.push({
          name: prop,
          old: oldP,
          new: newP
        });
      }
    }

    const typeChanged = oldS.type !== newS.type;
    const requiredChanged = !deepCompare(oldS.required, newS.required);

    if (addedProps.length > 0 || deletedProps.length > 0 || changedProps.length > 0 || typeChanged || requiredChanged) {
      modifiedSchemas.push({
        name: key,
        addedProps,
        deletedProps,
        changedProps,
        typeChanged,
        requiredChanged,
        old: oldS,
        new: newS
      });
    }
  }

  return {
    added: addedSchemas,
    deleted: deletedSchemas,
    modified: modifiedSchemas
  };
}

function comparePaths(oldPaths, newPaths) {
  const added = [];
  const deleted = [];
  const modified = [];

  // For paths, check path + method
  const getOperations = (pathsObj) => {
    const ops = {};
    for (const [pathKey, pathItem] of Object.entries(pathsObj)) {
      for (const [method, op] of Object.entries(pathItem)) {
        if (['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)) {
          ops[`${method.toUpperCase()} ${pathKey}`] = { path: pathKey, method, ...op };
        }
      }
    }
    return ops;
  };

  const oldOps = getOperations(oldPaths);
  const newOps = getOperations(newPaths);

  const oldKeys = Object.keys(oldOps);
  const newKeys = Object.keys(newOps);

  const addedKeys = newKeys.filter(k => !oldOps[k]);
  const deletedKeys = oldKeys.filter(k => !newOps[k]);
  const commonKeys = newKeys.filter(k => oldOps[k]);

  for (const k of addedKeys) {
    added.push(newOps[k]);
  }

  for (const k of deletedKeys) {
    deleted.push(oldOps[k]);
  }

  for (const k of commonKeys) {
    const oldOp = oldOps[k];
    const newOp = newOps[k];

    let changed = false;
    const changes = {
      summary: false,
      parameters: { added: [], deleted: [], changed: [] },
      requestBody: null,
      responses: { added: [], deleted: [], changed: [] }
    };

    if (oldOp.summary !== newOp.summary || oldOp.description !== newOp.description) {
      changes.summary = true;
      changed = true;
    }

    // Compare parameters
    const oldParams = oldOp.parameters || [];
    const newParams = newOp.parameters || [];

    const getParamKey = p => `${p.name} in ${p.in}`;
    const oldParamMap = new Map(oldParams.map(p => [getParamKey(p), p]));
    const newParamMap = new Map(newParams.map(p => [getParamKey(p), p]));

    for (const [key, p] of newParamMap) {
      if (!oldParamMap.has(key)) {
        changes.parameters.added.push(p);
        changed = true;
      } else {
        const oldP = oldParamMap.get(key);
        if (!deepCompare(oldP, p)) {
          changes.parameters.changed.push({ name: p.name, in: p.in, old: oldP, new: p });
          changed = true;
        }
      }
    }

    for (const [key, p] of oldParamMap) {
      if (!newParamMap.has(key)) {
        changes.parameters.deleted.push(p);
        changed = true;
      }
    }

    // Compare requestBody
    const oldBody = oldOp.requestBody;
    const newBody = newOp.requestBody;
    if (!deepCompare(oldBody, newBody)) {
      changes.requestBody = { old: oldBody, new: newBody };
      changed = true;
    }

    // Compare responses
    const oldResps = oldOp.responses || {};
    const newResps = newOp.responses || {};
    const oldRespKeys = Object.keys(oldResps);
    const newRespKeys = Object.keys(newResps);

    for (const code of newRespKeys) {
      if (!oldResps[code]) {
        changes.responses.added.push({ code, schema: newResps[code] });
        changed = true;
      } else if (!deepCompare(oldResps[code], newResps[code])) {
        changes.responses.changed.push({ code, old: oldResps[code], new: newResps[code] });
        changed = true;
      }
    }

    for (const code of oldRespKeys) {
      if (!newResps[code]) {
        changes.responses.deleted.push({ code, schema: oldResps[code] });
        changed = true;
      }
    }

    if (changed) {
      modified.push({
        key: k,
        path: oldOp.path,
        method: oldOp.method,
        summary: newOp.summary || oldOp.summary || '',
        tags: newOp.tags || oldOp.tags || [],
        changes
      });
    }
  }

  return { added, deleted, modified };
}

function getRequestBodySchemaString(body) {
  if (!body || !body.content) return 'None';
  const jsonContent = body.content['application/json'] || body.content['application/x-www-form-urlencoded'] || body.content['multipart/form-data'] || Object.values(body.content)[0];
  if (!jsonContent) return 'None';
  return resolveSchemaString(jsonContent.schema);
}

function getResponseSchemaString(resp) {
  if (!resp || !resp.content) return 'No Content';
  const jsonContent = resp.content['application/json'] || Object.values(resp.content)[0];
  if (!jsonContent) return 'No Content';
  return resolveSchemaString(jsonContent.schema);
}

function generateMarkdown(pathDiff, schemaDiff, newSchemas) {
  let md = `# Báo Cáo Thay Đổi API (So sánh với Git HEAD)\n\n`;
  md += `*Thời gian thực hiện so sánh:* \`${new Date().toLocaleString()}\`\n\n`;

  // SUMMARY
  md += `## I. Tổng Quan Thay Đổi\n\n`;
  md += `| Thành phần | Mới | Thay đổi | Xóa |\n`;
  md += `| :--- | :---: | :---: | :---: |\n`;
  md += `| **API (Endpoints)** | ${pathDiff.added.length} | ${pathDiff.modified.length} | ${pathDiff.deleted.length} |\n`;
  md += `| **Models (Schemas)** | ${schemaDiff.added.length} | ${schemaDiff.modified.length} | ${schemaDiff.deleted.length} |\n\n`;

  // NEW APIS
  md += `## II. Các API Mới Thêm (${pathDiff.added.length})\n\n`;
  if (pathDiff.added.length === 0) {
    md += `*Không có API nào mới.*\n\n`;
  } else {
    pathDiff.added.forEach(op => {
      md += `### 🟢 \`${op.method.toUpperCase()} ${op.path}\`\n`;
      md += `* **Chức năng:** ${op.summary || 'Không có mô tả'}\n`;
      md += `* **Nhóm (Tag):** \`${op.tags ? op.tags.join(', ') : 'N/A'}\`\n`;
      
      if (op.parameters && op.parameters.length > 0) {
        md += `* **Tham số:**\n`;
        op.parameters.forEach(p => {
          const req = p.required ? ' (Bắt buộc)' : ' (Tùy chọn)';
          md += `  - \`${p.name}\` (${p.in}): ${resolveSchemaString(p.schema)}${req}${p.description ? ` - ${p.description}` : ''}\n`;
        });
      }
      
      if (op.requestBody) {
        md += `* **Request Body:** ${getRequestBodySchemaString(op.requestBody)}\n`;
      }
      
      md += `* **Phản hồi (Responses):**\n`;
      Object.entries(op.responses).forEach(([code, res]) => {
        md += `  - \`${code}\`: ${res.description || ''} (Schema: ${getResponseSchemaString(res)})\n`;
      });
      md += `\n---\n\n`;
    });
  }

  // DELETED APIS
  md += `## III. Các API Đã Xóa (${pathDiff.deleted.length})\n\n`;
  if (pathDiff.deleted.length === 0) {
    md += `*Không có API nào bị xóa.*\n\n`;
  } else {
    pathDiff.deleted.forEach(op => {
      md += `### 🔴 \`${op.method.toUpperCase()} ${op.path}\`\n`;
      md += `* **Chức năng:** ${op.summary || 'Không có mô tả'}\n`;
      md += `* **Nhóm (Tag):** \`${op.tags ? op.tags.join(', ') : 'N/A'}\`\n\n`;
    });
  }

  // MODIFIED APIS
  md += `## IV. Các API Thay Đổi Cấu Trúc (${pathDiff.modified.length})\n\n`;
  if (pathDiff.modified.length === 0) {
    md += `*Không có API nào bị thay đổi.*\n\n`;
  } else {
    pathDiff.modified.forEach(mod => {
      md += `### 🟡 \`${mod.method.toUpperCase()} ${mod.path}\`\n`;
      md += `* **Chức năng:** ${mod.summary || 'Không có mô tả'}\n`;
      md += `* **Nhóm (Tag):** \`${mod.tags ? mod.tags.join(', ') : 'N/A'}\`\n`;
      md += `* **Chi tiết thay đổi:**\n`;

      const ch = mod.changes;
      if (ch.summary) {
        md += `  - 📝 Cập nhật tiêu đề / mô tả chức năng.\n`;
      }

      // Parameters changes
      if (ch.parameters.added.length > 0) {
        ch.parameters.added.forEach(p => {
          md += `  - ➕ Thêm tham số: \`${p.name}\` trong \`${p.in}\` (${resolveSchemaString(p.schema)}${p.required ? ', Bắt buộc' : ''})\n`;
        });
      }
      if (ch.parameters.deleted.length > 0) {
        ch.parameters.deleted.forEach(p => {
          md += `  - ➖ Xóa tham số: \`${p.name}\` trong \`${p.in}\`\n`;
        });
      }
      if (ch.parameters.changed.length > 0) {
        ch.parameters.changed.forEach(c => {
          const oldStr = resolveSchemaString(c.old.schema) + (c.old.required ? ' (Bắt buộc)' : ' (Tùy chọn)');
          const newStr = resolveSchemaString(c.new.schema) + (c.new.required ? ' (Bắt buộc)' : ' (Tùy chọn)');
          md += `  - 🔄 Thay đổi tham số \`${c.name}\` (\`${c.in}\`): từ \`${oldStr}\` thành \`${newStr}\`\n`;
        });
      }

      // Request body changes
      if (ch.requestBody) {
        const oldBodyStr = getRequestBodySchemaString(ch.requestBody.old);
        const newBodyStr = getRequestBodySchemaString(ch.requestBody.new);
        md += `  - 📦 Thay đổi **Request Body**: từ \`${oldBodyStr}\` thành \`${newBodyStr}\`\n`;
      }

      // Response changes
      if (ch.responses.added.length > 0) {
        ch.responses.added.forEach(r => {
          md += `  - ➕ Thêm mã phản hồi: \`${r.code}\` (${getResponseSchemaString(r.schema)})\n`;
        });
      }
      if (ch.responses.deleted.length > 0) {
        ch.responses.deleted.forEach(r => {
          md += `  - ➖ Xóa mã phản hồi: \`${r.code}\`\n`;
        });
      }
      if (ch.responses.changed.length > 0) {
        ch.responses.changed.forEach(r => {
          const oldStr = getResponseSchemaString(r.old);
          const newStr = getResponseSchemaString(r.new);
          md += `  - 🔄 Thay đổi phản hồi \`${r.code}\`: từ \`${oldStr}\` thành \`${newStr}\`\n`;
        });
      }

      md += `\n---\n\n`;
    });
  }

  // MODELS (SCHEMAS) CHANGES
  md += `## V. Thay Đổi Ở Các Models / Schemas\n\n`;

  // Added Schemas
  md += `### 1. Model Mới (${schemaDiff.added.length})\n\n`;
  if (schemaDiff.added.length === 0) {
    md += `*Không có model mới.*\n\n`;
  } else {
    schemaDiff.added.forEach(key => {
      md += `#### 🟢 Model \`${key}\`\n`;
      const schema = newSchemas[key];
      if (schema && schema.properties) {
        md += `Các trường thuộc tính:\n`;
        Object.entries(schema.properties).forEach(([propName, propSchema]) => {
          const req = (schema.required && schema.required.includes(propName)) ? ' (Bắt buộc)' : ' (Tùy chọn)';
          md += `- \`${propName}\` (${resolveSchemaString(propSchema)})${req}${propSchema.description ? ` - ${propSchema.description}` : ''}\n`;
        });
      } else if (schema) {
        md += `*Không có thuộc tính (Kiểu: \`${schema.type || 'object'}\`)*\n`;
      }
      md += `\n`;
    });
    md += `\n`;
  }

  // Deleted Schemas
  md += `### 2. Model Đã Xóa (${schemaDiff.deleted.length})\n\n`;
  if (schemaDiff.deleted.length === 0) {
    md += `*Không có model bị xóa.*\n\n`;
  } else {
    schemaDiff.deleted.forEach(key => {
      md += `- \`${key}\`\n`;
    });
    md += `\n`;
  }

  // Modified Schemas
  md += `### 3. Model Bị Thay Đổi Cấu Trúc (${schemaDiff.modified.length})\n\n`;
  if (schemaDiff.modified.length === 0) {
    md += `*Không có model nào bị thay đổi.*\n\n`;
  } else {
    schemaDiff.modified.forEach(mod => {
      md += `#### 🔲 Model \`${mod.name}\`\n`;
      
      if (mod.typeChanged) {
        md += `- 🔄 Thay đổi kiểu dữ liệu chính: từ \`${mod.old.type}\` thành \`${mod.new.type}\`\n`;
      }
      if (mod.requiredChanged) {
        const oldReq = mod.old.required ? mod.old.required.join(', ') : 'không có';
        const newReq = mod.new.required ? mod.new.required.join(', ') : 'không có';
        md += `- 🔄 Thay đổi danh sách các trường bắt buộc:\n`;
        md += `  - Trước: \`[${oldReq}]\`\n`;
        md += `  - Sau: \`[${newReq}]\`\n`;
      }

      if (mod.addedProps.length > 0) {
        md += `- ➕ Thêm các trường mới:\n`;
        mod.addedProps.forEach(p => {
          const schema = mod.new.properties[p];
          md += `  - \`${p}\` (${resolveSchemaString(schema)})\n`;
        });
      }

      if (mod.deletedProps.length > 0) {
        md += `- ➖ Xóa các trường:\n`;
        mod.deletedProps.forEach(p => {
          md += `  - \`${p}\`\n`;
        });
      }

      if (mod.changedProps.length > 0) {
        md += `- 🔄 Thay đổi kiểu dữ liệu / thuộc tính các trường:\n`;
        mod.changedProps.forEach(c => {
          const oldStr = resolveSchemaString(c.old);
          const newStr = resolveSchemaString(c.new);
          md += `  - Trường \`${c.name}\`: từ \`${oldStr}\` thành \`${newStr}\`\n`;
        });
      }
      md += `\n`;
    });
  }

  return md;
}

try {
  console.log('Loading old swagger...');
  const oldSwagger = getOldSwagger();
  console.log('Loading new swagger...');
  const newSwagger = getNewSwagger();

  console.log('Comparing paths...');
  const pathDiff = comparePaths(oldSwagger.paths || {}, newSwagger.paths || {});

  console.log('Comparing schemas...');
  const oldSchemas = (oldSwagger.components && oldSwagger.components.schemas) || {};
  const newSchemas = (newSwagger.components && newSwagger.components.schemas) || {};
  const schemaDiff = compareSchemas(oldSchemas, newSchemas);

  console.log('Generating markdown report...');
  const markdown = generateMarkdown(pathDiff, schemaDiff, newSchemas);

  const outputPath = path.join(__dirname, '../docs/swagger-api-changes.md');
  fs.writeFileSync(outputPath, markdown, 'utf8');
  console.log(`Successfully generated report and saved to: ${outputPath}`);
} catch (err) {
  console.error('Failure in comparing swagger files:', err);
  process.exit(1);
}
