import * as fs from 'fs';
import * as path from 'path';

const targetPath = path.resolve('pages/Admin/Inventory.tsx');
let code = fs.readFileSync(targetPath, 'utf-8');

// 1. Add toast import
code = code.replace(
  "import React, { useEffect, useMemo, useState } from 'react';",
  "import React, { useEffect, useMemo, useState } from 'react';\nimport { toast } from 'react-hot-toast';"
);

// 2. Remove obsolete status states and add modalTab
code = code.replace(
  /const \[csvImportStatus, setCsvImportStatus\][\s\S]*?message: ''\n  \}\);/,
  "// CSV Import status handled via toast"
);
code = code.replace(
  /const \[translationStatus, setTranslationStatus\][\s\S]*?message: ''\n  \}\);/,
  "// Translation status handled via toast"
);
code = code.replace(
  /const \[primaryImageUploadError, setPrimaryImageUploadError\] = useState<string \| null>\(null\);/,
  "const [modalTab, setModalTab] = useState<'general' | 'media' | 'specs' | 'settings'>('general');"
);

// 3. Update primaryImageUploadError usages to toast
code = code.replace(/setPrimaryImageUploadError\(null\);/g, '');
code = code.replace(
  /setPrimaryImageUploadError\(err\?\.message \|\| copy\.imageUploadFailed\);/g,
  "toast.error(err?.message || copy.imageUploadFailed);"
);

// 4. Update pushTranslationStatus function to use toast directly
code = code.replace(
  /const pushTranslationStatus = \(type: 'success' \| 'error', message: string\) => \{[\s\S]*?\}\;/g,
  "const pushTranslationStatus = (type: 'success' | 'error', message: string) => {\n    if (type === 'success') toast.success(message);\n    else toast.error(message);\n  };"
);

// 5. Update setTranslationStatus references that were used to clear status
code = code.replace(/setTranslationStatus\(\{ type: null, message: '' \}\);/g, '');

// 6. Update setCsvImportStatus usages in importing to toast
code = code.replace(
  /setCsvImportStatus\(\{ type: null, message: '' \}\);/g,
  ""
);
code = code.replace(
  /setCsvImportStatus\(\{ type: 'error', message: (.*?)\ \}\);/g,
  "toast.error($1);"
);
code = code.replace(
  /setCsvImportStatus\(\{[\s\S]*?type: 'success',[\s\S]*?message: ([\s\S]*?)\n    \}\);/g,
  "toast.success($1);"
);

// 7. Remove UI rendering of translationStatus and csvImportStatus and errors
code = code.replace(
  /\{csvImportStatus\.type && \([\s\S]*?\{csvImportStatus\.message\}\n\s*<\/div>\n\s*\)\}/g,
  ""
);
code = code.replace(
  /\{translationStatus\.type && \([\s\S]*?\{translationStatus\.message\}\n\s*<\/div>\n\s*\)\}/g,
  ""
);
code = code.replace(
  /\{primaryImageUploadError && \([\s\S]*?\{primaryImageUploadError\}\n\s*<\/p>\n\s*\)\}/g,
  ""
);

// Add Tab Buttons UI into the modal
const tabButtonsUI = `
            {/* Tab Bar */}
            <div className="flex border-b border-gray-200 px-10 pt-4 gap-1 bg-gray-50/50 flex-shrink-0">
              {(['general', 'media', 'specs', 'settings'] as const).map((tab) => {
                const tabLabels = { general: 'General', media: 'Gallery & Media', specs: 'Specs & Options', settings: 'Translation & Settings' };
                const isActive = modalTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setModalTab(tab)}
                    className={\`px-5 py-3 text-[10px] font-black uppercase tracking-widest rounded-t-xl transition-all \${
                      isActive
                        ? 'bg-white text-foodmax-forest border border-gray-200 border-b-white -mb-px shadow-sm'
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100/50'
                    }\`}
                  >
                    {tabLabels[tab]}
                  </button>
                );
              })}
            </div>
            
            <form onSubmit={handleSave} className="flex-grow overflow-y-auto flex flex-col">
              <div className="flex-grow overflow-y-auto p-10 space-y-10">
`;

code = code.replace(
  /<form onSubmit=\{handleSave\} className="flex-grow overflow-y-auto p-10 space-y-10">/,
  tabButtonsUI
);

// Close forms & map sections to tabs
code = code.replace(
  /\{\/\* Product SKU \/ ID - NOW MANUALLY EDITABLE \*\/\}/g,
  "{modalTab === 'general' && (<>\n              {/* Product SKU / ID - NOW MANUALLY EDITABLE */}"
);

code = code.replace(
  /\{\/\* Product PDF Section \*\/\}/g,
  "{modalTab === 'media' && (<>\n              {/* Product PDF Section */}"
);

code = code.replace(
  /\{\/\* Basic Info \*\/\}/g,
  "</>)}\n              {modalTab === 'general' && (<>\n              {/* Basic Info */}"
);

code = code.replace(
  /\{\/\* DYNAMIC QUALITY SPECS EDITOR \*\/\}/g,
  "</>)}\n              {modalTab === 'specs' && (<>\n              {/* DYNAMIC QUALITY SPECS EDITOR */}"
);

code = code.replace(
  /<div className="space-y-6 rounded-\[2\.5rem\] border border-gray-100 bg-white p-8 shadow-sm">/,
  "</>)}\n              {modalTab === 'settings' && (<>\n              <div className=\"space-y-6 rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm\">"
);

code = code.replace(
  /<\/form>/,
  "</>)}\n</div></form>"
);


// Replace the specs layout to look like a table without heavy borders, and hover-to-show trash
const specsLegacyHtml = `className="p-3 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={18} />`;

const specsNewHtml = `className="p-2 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all rounded-full hover:bg-red-50"
                      >
                        <Trash2 size={14} />`;

code = code.replace(new RegExp(specsLegacyHtml.replace(/[.*+?^$\{\}\(\)\|\[\]\\]/g, '\\$&'), 'g'), specsNewHtml);

const inputLegacy1 = `className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-black uppercase tracking-widest outline-none focus:border-foodmax-forest"`;
const inputNew1 = `className="w-full px-4 py-3 bg-transparent border-2 border-transparent hover:border-gray-50 focus:bg-white focus:shadow-sm focus:border-foodmax-forest/20 rounded-xl text-xs font-black uppercase tracking-widest outline-none transition-all placeholder:text-gray-300"`;

const inputLegacy2 = `className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-foodmax-forest"`;
const inputNew2 = `className="w-full px-4 py-3 bg-transparent border-2 border-transparent hover:border-gray-50 focus:bg-white focus:shadow-sm focus:border-foodmax-forest/20 rounded-xl text-xs font-bold outline-none transition-all placeholder:text-gray-300"`;

code = code.replace(new RegExp(inputLegacy1.replace(/[.*+?^$\{\}\(\)\|\[\]\\]/g, '\\$&'), 'g'), inputNew1);
code = code.replace(new RegExp(inputLegacy2.replace(/[.*+?^$\{\}\(\)\|\[\]\\]/g, '\\$&'), 'g'), inputNew2);

const flexWrapperLegacy = `className="flex gap-3 animate-in fade-in slide-in-from-top-1 duration-200"`;
const flexWrapperNew = `className="flex items-center gap-3 group animate-in fade-in slide-in-from-top-1 duration-200 border-b border-gray-50 pb-2 mb-2"`;

code = code.replace(new RegExp(flexWrapperLegacy.replace(/[.*+?^$\{\}\(\)\|\[\]\\]/g, '\\$&'), 'g'), flexWrapperNew);


fs.writeFileSync(targetPath, code);
console.log('Refactoring complete.');
