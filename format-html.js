import * as fs from 'fs';
import * as path from 'path';
import prettier from 'prettier';

async function formatHtmlFiles() {
    const distDir = './dist';
    const files = ['index.html', 'train-star.html'];

    for (const file of files) {
        const filePath = path.join(distDir, file);

        if (fs.existsSync(filePath)) {
            console.log(`正在格式化 ${file}...`);

            const htmlContent = fs.readFileSync(filePath, 'utf8');

            // 使用 prettier 进行格式化
            const formattedHtml = await prettier.format(htmlContent, {
                parser: 'html',
                printWidth: 120,
                tabWidth: 4,
                useTabs: false,
                semi: true,
                singleQuote: false,
                quoteProps: 'as-needed',
                trailingComma: 'es5',
                bracketSpacing: true,
                bracketSameLine: false,
                arrowParens: 'always',
                endOfLine: 'lf',
                embeddedLanguageFormatting: 'auto',
                singleAttributePerLine: false
            });

            fs.writeFileSync(filePath, formattedHtml);
            console.log(`✅ ${file} 格式化完成`);
        } else {
            console.log(`⚠️ 文件 ${file} 不存在`);
        }
    }

    console.log('🎉 所有HTML文件格式化完成！');
}

formatHtmlFiles().catch(console.error);
