# AI 提示词审阅稿

本文档记录周报通当前使用的 AI 提示词，便于审阅和后续调整。实际调用的是 OpenAI-compatible 云端大模型接口，不绑定 OpenAI 官方模型。

## AI 承接检查

使用位置：成员提交周报后，系统异步检查“上周计划”是否在本周工作、问题解决或补充说明中体现。

输入变量：
- `memberName`：成员姓名
- `previousPlanItems`：上一周周报中的下周计划
- `currentWorkItems`：本周工作情况
- `currentProblemItems`：问题及解决办法
- `freeTextContent`：补充说明

提示词：

```text
请检查成员本周内容是否承接了上周计划。
必须只输出 JSON 对象，不要输出 Markdown 代码块、解释或额外文字。
JSON 字段必须严格匹配：matchedItems, missingItems, summary。
matchedItems 和 missingItems 必须是字符串数组；summary 必须是中文字符串。
只能基于输入内容判断，不要编造完成情况。

{{JSON_INPUT}}
```

## AI 汇总

使用位置：管理员在周报周期详情页点击“AI 汇总”，系统将成员提交内容汇总为项目周报草稿。

输入变量：
- `title`：周报标题
- `nextPlanTitle`：下周计划章节标题
- `submissions`：成员提交列表，每项包含成员姓名、本周工作、延期说明、问题解决、下周计划、补充说明和承接检查摘要

提示词：

```text
请将以下成员周报汇总为一份项目周报。
必须只输出 JSON 对象，不要输出 Markdown 代码块、解释或额外文字。
JSON 字段必须严格匹配：title, workItems, delayItems, aiAnalysis, problemItems, nextPlanItems, nextPlanTitle。
workItems、delayItems、problemItems、nextPlanItems 必须是字符串数组；aiAnalysis 必须是字符串。
缺失的模块保持空数组或空字符串，不要编造未提供的信息。
合并同类项，保留成员姓名和关键结果；延期、问题、风险要具体可追踪。

{{JSON_INPUT}}
```

## AI 润色

使用位置：管理员在周报周期详情页点击“AI 润色”，系统对汇总草稿或已有内容进行表达优化。

输入变量：
- `reportContent`：待润色的完整周报正文

提示词：

```text
请润色下面的项目周报正文。
保持原有章节标题、事实和未填写状态，不要新增事实、指标或承诺。
输出润色后的完整正文，不要输出解释。

{{REPORT_CONTENT}}
```
