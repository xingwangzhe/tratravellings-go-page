#!/usr/bin/env node

import fs from 'fs';

function checkHtmlFormatting(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');

        console.log(`📄 检查文件: ${filePath}`);
        console.log(`📏 文件大小: ${content.length} 字符`);

        // 检查是否是单行
        const lines = content.split('\n');
        console.log(`📊 总行数: ${lines.length}`);

        // 检查DOCTYPE
        const hasDoctype = content.toLowerCase().includes('<!doctype html>');
        console.log(`🏷️  DOCTYPE声明: ${hasDoctype ? '✅ 存在' : '❌ 缺失'}`);

        // 检查基本HTML结构
        const hasHtmlTag = /<html[^>]*>/i.test(content);
        const hasHeadTag = /<head[^>]*>/i.test(content);
        const hasBodyTag = /<body[^>]*>/i.test(content);
        console.log(`🏗️  HTML结构:`);
        console.log(`   - HTML标签: ${hasHtmlTag ? '✅' : '❌'}`);
        console.log(`   - HEAD标签: ${hasHeadTag ? '✅' : '❌'}`);
        console.log(`   - BODY标签: ${hasBodyTag ? '✅' : '❌'}`);

        // 检查格式化质量
        const indentedLines = lines.filter(line => line.match(/^\s+/));
        const indentationRatio = indentedLines.length / lines.length;
        console.log(`📏 缩进统计: ${indentedLines.length}/${lines.length} 行有缩进 (${(indentationRatio * 100).toFixed(1)}%)`);

        // 检查是否压缩（单行）
        const isCompressed = lines.length < 10 && content.length > 1000;
        console.log(`🗜️  压缩状态: ${isCompressed ? '❌ 可能是压缩的' : '✅ 正常格式化'}`);

        // 显示前几行作为示例
        console.log(`\n📝 前10行内容示例:`);
        lines.slice(0, 10).forEach((line, i) => {
            const indent = line.match(/^(\s*)/)[1].length;
            console.log(`${(i + 1).toString().padStart(2)}: ${' '.repeat(Math.min(indent, 20))}${line.trim() || '(空行)'}`);
        });

        // 检查CSS格式化
        const styleMatches = content.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
        if (styleMatches) {
            console.log(`\n🎨 CSS检查:`);
            styleMatches.forEach((style, i) => {
                const cssContent = style.match(/<style[^>]*>([\s\S]*?)<\/style>/i)[1];
                const cssLines = cssContent.split('\n');
                console.log(`   样式块 ${i + 1}: ${cssLines.length} 行, ${cssContent.length} 字符`);
            });
        }

        // 总体评估
        const score = (
            (hasDoctype ? 20 : 0) +
            (hasHtmlTag ? 15 : 0) +
            (hasHeadTag ? 15 : 0) +
            (hasBodyTag ? 15 : 0) +
            (indentationRatio > 0.3 ? 20 : indentationRatio * 50) +
            (!isCompressed ? 15 : 0)
        );

        console.log(`\n🎯 格式化评分: ${score.toFixed(1)}/100`);

        if (score > 70) {
            console.log('✅ HTML文件格式化良好！');
        } else if (score > 40) {
            console.log('⚠️  HTML文件格式化一般');
        } else {
            console.log('❌ HTML文件可能没有正确格式化');
        }

    } catch (error) {
        console.error(`❌ 读取文件失败: ${error.message}`);
    }
}

// 检查命令行参数
const filePath = process.argv[2];
if (!filePath) {
    console.log('用法: node check-html-format.js <html文件路径>');
    process.exit(1);
}

checkHtmlFormatting(filePath);
