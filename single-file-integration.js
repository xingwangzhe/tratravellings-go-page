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
                    console.log(`处理HTML文件: ${htmlFile}`);
                    let htmlContent = fs.readFileSync(htmlFile, 'utf8');
                    
                    // 替换CSS链接为内联样式
                    for (const cssFile of cssFiles) {
                        const cssContent = fs.readFileSync(cssFile, 'utf8');
                        const cssFileName = path.basename(cssFile);
                        const relativePath = path.relative(path.dirname(htmlFile), cssFile);
                        
                        // 更精确的CSS链接匹配
                        const cssRegexes = [
                            new RegExp(`<link[^>]*href="[^"]*${cssFileName}"[^>]*>`, 'g'),
                            new RegExp(`<link[^>]*href="[^"]*${relativePath.replace(/\\/g, '/')}"[^>]*>`, 'g'),
                            new RegExp(`<link[^>]*href="\\.\\/[^"]*${cssFileName}"[^>]*>`, 'g')
                        ];
                        
                        cssRegexes.forEach(regex => {
                            htmlContent = htmlContent.replace(regex, `<style>${cssContent}</style>`);
                        });
                    }
                    
                    // 处理JS文件 - 内联所有JS文件
                    for (const jsFile of jsFiles) {
                        const jsContent = fs.readFileSync(jsFile, 'utf8');
                        const jsFileName = path.basename(jsFile);
                        const relativePath = path.relative(path.dirname(htmlFile), jsFile);
                        
                        // 更精确的JS文件匹配
                        const jsRegexes = [
                            new RegExp(`<script[^>]*src="[^"]*${jsFileName}"[^>]*></script>`, 'g'),
                            new RegExp(`<script[^>]*src="[^"]*${relativePath.replace(/\\/g, '/')}"[^>]*></script>`, 'g'),
                            new RegExp(`<script[^>]*src="\\.\\/[^"]*${jsFileName}"[^>]*></script>`, 'g')
                        ];
                        
                        jsRegexes.forEach(regex => {
                            htmlContent = htmlContent.replace(regex, `<script type="module">${jsContent}</script>`);
                        });
                    }
                    
                    // 替换SVG引用为data URI
                    for (const [fileName, dataUri] of Object.entries(svgDataMap)) {
                        const svgRegexes = [
                            new RegExp(`(src|href)="([^"]*/)?${fileName}"`, 'g'),
                            new RegExp(`(src|href)="\\.\\/[^"]*${fileName}"`, 'g'),
                            new RegExp(`(src|href)="[^"]*_astro[^"]*${fileName.replace('.svg', '')}[^"]*"`, 'g')
                        ];
                        
                        svgRegexes.forEach(regex => {
                            htmlContent = htmlContent.replace(regex, `$1="${dataUri}"`);
                        });
                    }
                    
                    // 替换Astro生成的图片引用
                    const astroImageRegex = /(src|href)="([^"]*\/_astro\/[^"]*\.(png|jpg|jpeg|gif|webp|svg))"/g;
                    htmlContent = htmlContent.replace(astroImageRegex, (match, attr, imagePath) => {
                        const fullImagePath = path.join(folder, imagePath.replace(/^\//, ''));
                        if (fs.existsSync(fullImagePath)) {
                            const ext = path.extname(fullImagePath).toLowerCase();
                            const imageContent = fs.readFileSync(fullImagePath);
                            let mimeType = 'image/png';
                            
                            switch (ext) {
                                case '.jpg':
                                case '.jpeg':
                                    mimeType = 'image/jpeg';
                                    break;
                                case '.gif':
                                    mimeType = 'image/gif';
                                    break;
                                case '.webp':
                                    mimeType = 'image/webp';
                                    break;
                                case '.svg':
                                    mimeType = 'image/svg+xml';
                                    return `${attr}="data:${mimeType},${encodeURIComponent(fs.readFileSync(fullImagePath, 'utf8'))}"`;
                                default:
                                    mimeType = 'image/png';
                            }
                            
                            const base64 = imageContent.toString('base64');
                            return `${attr}="data:${mimeType};base64,${base64}"`;
                        }
                        return match;
                    });
                    
                    // 处理外部CDN链接 - 确保它们保持可访问
                    console.log('保持外部CDN链接不变...');
                    
                    // 使用更好的HTML压缩
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
                            minifyCSS: {
                                level: 2
                            },
                            minifyJS: {
                                mangle: false, // 不混淆变量名，避免破坏功能
                                compress: {
                                    drop_console: false // 保留console语句用于调试
                                }
                            },
                            removeAttributeQuotes: false, // 保持属性引号，避免破坏
                            removeEmptyAttributes: true,
                            removeOptionalTags: false, // 保持可选标签，提高兼容性
                            removeRedundantAttributes: false, // 不要移除冗余属性，保留SVG的width和height
                            sortAttributes: false, // 不排序属性，避免破坏
                            sortClassName: false // 不排序类名，避免破坏CSS
                        });
                        console.log('HTML压缩成功');
                    } catch (error) {
                        console.warn('HTML压缩失败，使用基础压缩:', error.message);
                        // 基础压缩（移除多余空白字符，但保持可读性）
                        finalHtml = htmlContent
                            .replace(/\s{2,}/g, ' ') // 多个空格压缩为一个
                            .replace(/>\s+</g, '><') // 标签间空白
                            .replace(/\n\s*/g, '\n') // 保持换行但移除行首空白
                            .trim();
                    }
                    
                    // 确保目标目录存在
                    const outputDir = path.dirname(htmlFile);
                    if (!fs.existsSync(outputDir)) {
                        fs.mkdirSync(outputDir, { recursive: true });
                    }

                    // 只处理主要的HTML文件（通常是index.html）
                    const fileName = path.basename(htmlFile);
                    if (fileName === 'index.html') {
                        // 写入单文件版本
                        const singleFilePath = path.join(outputDir, 'train-star.html');
                        fs.writeFileSync(singleFilePath, finalHtml);
                        console.log(`生成单文件HTML: ${singleFilePath}`);
                        
                        // 保持原始index.html
                        console.log(`保持原始文件: ${htmlFile}`);
                    }
                }
                
                // 清理已内联的资源文件（但不删除我们生成的HTML文件）
                console.log('清理已内联的资源文件...');
                const filesToDelete = [...cssFiles, ...jsFiles].filter(file => {
                    const fileName = path.basename(file);
                    // 不删除关键文件
                    return !fileName.includes('train-star') && !fileName.includes('index');
                });
                
                filesToDelete.forEach(file => {
                    try {
                        if (fs.existsSync(file)) {
                            fs.unlinkSync(file);
                            console.log(`删除已内联文件: ${path.basename(file)}`);
                        }
                    } catch (error) {
                        console.warn(`删除文件失败 ${file}:`, error.message);
                    }
                });
                
                // 删除_astro目录
                const astroDir = path.join(folder, '_astro');
                if (fs.existsSync(astroDir)) {
                    try {
                        fs.rmSync(astroDir, { recursive: true, force: true });
                        console.log('删除_astro目录');
                    } catch (error) {
                        console.warn('删除_astro目录失败:', error.message);
                    }
                }
                
                // 删除favicon.svg文件
                const faviconPath = path.join(folder, 'favicon.svg');
                if (fs.existsSync(faviconPath)) {
                    try {
                        fs.unlinkSync(faviconPath);
                        console.log('删除favicon.svg文件');
                    } catch (error) {
                        console.warn('删除favicon.svg文件失败:', error.message);
                    }
                }
                
                // 删除空目录（但要小心不要删除重要目录）
                try {
                    removeEmptyDirs(folder);
                    console.log('清理空目录完成');
                } catch (error) {
                    console.warn('清理空目录失败:', error.message);
                }
                
                console.log('单文件构建处理完成！');
                console.log(`生成的文件: train-star.html`);
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
    try {
        if (!fs.existsSync(dir)) return;
        
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const filePath = path.join(dir, item);
            if (!fs.existsSync(filePath)) continue;
            
            const stat = fs.statSync(filePath);
            
            if (stat.isDirectory()) {
                removeEmptyDirs(filePath);
                // 检查目录是否为空，且不是重要目录
                try {
                    const dirItems = fs.readdirSync(filePath);
                    if (dirItems.length === 0 && !['assets', 'images', 'static'].includes(item)) {
                        fs.rmdirSync(filePath);
                        console.log(`删除空目录: ${filePath}`);
                    }
                } catch (error) {
                    // 忽略删除目录失败的错误
                }
            }
        }
    } catch (error) {
        console.warn(`处理目录 ${dir} 时出错:`, error.message);
    }
}