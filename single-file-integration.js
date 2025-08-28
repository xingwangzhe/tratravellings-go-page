import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

export default function singleFileIntegration() {
    return {
        name: 'single-file-integration',
        hooks: {
            'astro:build:done': async ({ dir }) => {
                console.log('开始处理单文件构建...');
                console.log('dir:', dir);
                console.log('dir.pathname:', dir.pathname);
                
                let folder;
                if (typeof dir === 'string') {
                    folder = dir;
                } else if (dir && dir.pathname) {
                    try {
                        folder = fileURLToPath(dir.href);
                    } catch (error) {
                        console.log('fileURLToPath failed, trying decodeURIComponent:', error.message);
                        folder = decodeURIComponent(dir.pathname);
                    }
                } else {
                    throw new Error('Unable to determine build directory');
                }
                
                // 读取所有文件
                const files = getAllFiles(folder);
                
                // 获取HTML, CSS, JS文件
                const htmlFiles = files.filter(f => f.endsWith('.html'));
                const cssFiles = files.filter(f => f.endsWith('.css'));
                const jsFiles = files.filter(f => f.endsWith('.js'));
                const svgFiles = files.filter(f => f.endsWith('.svg'));
                
                // 创建SVG到data URI的映射
                const svgDataMap = {};
                for (const svgFile of svgFiles) {
                    const svgContent = fs.readFileSync(svgFile, 'utf8');
                    const svgDataUri = `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
                    const fileName = path.basename(svgFile);
                    svgDataMap[fileName] = svgDataUri;
                }
                
                // 处理每个HTML文件
                for (const htmlFile of htmlFiles) {
                    let htmlContent = fs.readFileSync(htmlFile, 'utf8');
                    
                    // 替换CSS链接为内联样式
                    for (const cssFile of cssFiles) {
                        const cssContent = fs.readFileSync(cssFile, 'utf8');
                        const cssFileName = path.basename(cssFile);
                        const cssRegex = new RegExp(`<link[^>]*href="[^"]*${cssFileName}"[^>]*>`, 'g');
                        htmlContent = htmlContent.replace(cssRegex, `<style>${cssContent}</style>`);
                    }
                    
                    // 处理JS文件 - 内联所有JS文件
                    for (const jsFile of jsFiles) {
                        const jsContent = fs.readFileSync(jsFile, 'utf8');
                        const jsFileName = path.basename(jsFile);
                        const jsRegex = new RegExp(`<script[^>]*src="[^"]*${jsFileName}"[^>]*></script>`, 'g');
                        htmlContent = htmlContent.replace(jsRegex, `<script type="module">${jsContent}</script>`);
                    }
                    
                    // 替换SVG引用为data URI
                    for (const [fileName, dataUri] of Object.entries(svgDataMap)) {
                        const fileRegex = new RegExp(`(src|href)="([^"]*/)?${fileName}"`, 'g');
                        htmlContent = htmlContent.replace(fileRegex, `$1="${dataUri}"`);
                    }
                    
                    // 使用Astro内置的HTML压缩
                    let finalHtml = htmlContent;
                    try {
                        // 导入并使用html-minifier-terser进行更彻底的压缩
                        const { minify } = await import('html-minifier-terser');
                        finalHtml = await minify(htmlContent, {
                            collapseWhitespace: true,
                            keepClosingSlash: true,
                            removeComments: true,
                            removeRedundantAttributes: true,
                            removeScriptTypeAttributes: false, // 保持type属性
                            removeStyleLinkTypeAttributes: true,
                            useShortDoctype: true,
                            minifyCSS: true,
                            minifyJS: true,
                            removeAttributeQuotes: true,
                            removeEmptyAttributes: true,
                            removeOptionalTags: true,
                            sortAttributes: true,
                            sortClassName: true
                        });
                    } catch (error) {
                        console.warn('HTML压缩失败，使用基础压缩:', error.message);
                        // 基础压缩（移除多余空白字符）
                        finalHtml = htmlContent
                            .replace(/\s+/g, ' ')
                            .replace(/>\s+</g, '><')
                            .trim();
                    }
                    
                    // 确保目标目录存在
                    const outputDir = path.dirname(htmlFile);
                    if (!fs.existsSync(outputDir)) {
                        fs.mkdirSync(outputDir, { recursive: true });
                    }

                    // 写入处理后的HTML文件
                    const newHtmlFilePath = path.join(outputDir, 'train-star.html');
                    fs.writeFileSync(newHtmlFilePath, finalHtml);

                    // 创建index.html副本以支持preview命令
                    const indexHtmlFilePath = path.join(outputDir, 'index.html');
                    fs.writeFileSync(indexHtmlFilePath, finalHtml);

                    // 如果原始HTML文件不是我们刚创建的文件，则删除
                    const originalFileName = path.basename(htmlFile);
                    if (originalFileName !== 'train-star.html' && originalFileName !== 'index.html') {
                        fs.unlinkSync(htmlFile);
                    }
                }
                
                // 删除已内联的CSS、JS和SVG文件，但不删除我们创建的文件
                const filesToDelete = [...cssFiles, ...jsFiles, ...svgFiles].filter(file => {
                    const fileName = path.basename(file);
                    return fileName !== 'train-star.html' && fileName !== 'index.html';
                });
                
                filesToDelete.forEach(file => {
                    if (fs.existsSync(file)) {
                        fs.unlinkSync(file);
                    }
                });
                
                // 删除空目录
                removeEmptyDirs(folder);
                
                console.log('单文件构建处理完成！');
            }
        }
    };
}

// 获取目录下所有文件的辅助函数
function getAllFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const filePath = path.join(dir, item);
        const stat = fs.statSync(filePath);
        
        if (stat.isFile()) {
            files.push(filePath);
        } else if (stat.isDirectory()) {
            files.push(...getAllFiles(filePath));
        }
    }
    
    return files;
}

// 删除空目录的辅助函数
function removeEmptyDirs(dir) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const filePath = path.join(dir, item);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            removeEmptyDirs(filePath);
            // 检查目录是否为空
            if (fs.readdirSync(filePath).length === 0) {
                fs.rmdirSync(filePath);
            }
        }
    }
}