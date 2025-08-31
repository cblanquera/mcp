# Title

Always add a description after a title. The title description should summarize what this documentation is about *(use the main subjects as a guide)*. Use between 1-3 paragraphs only. More paragraphs should be split into main subjects. A document should have at least 2 main subjects.

## 1. Main Subject 1

Always add a description after every main subject. If you cannot determine a proper description, then summarize or paraphrase or tl;dr the supporting points you are about to describe. Use only 1-3 paragraphs. More paragraphs should be split into supporting points. 

In any main subject or supporting point, you can add bullet lists like the following.

 - Always add a space before and after a dash when creating a bullet point
 - Bullet points are made to be short. Use only 1-3 sentences.
 - Never add just one bullet point. If you need a bullet point make sure there are at least 2 bullet points. 
 - Feel free to prefix bullet text with emojis

### 1.1. Supporting Point 1.1. of Main Subject 1

Always add a description after every supporting point. If you cannot determine a proper description, then summarize or paraphrase or tl;dr the supporting points in this section. If this section has no supporting points, then summarize or paraphrase or tl;dr the content in this section you are about to describe.

In any main subject or supporting point, you can add number lists like the following.

 1. Always add a space before the number and after the period.
 2. Number points are made to be short. Use only 1-3 sentences.
 3. Never add just one number point. If you need a number point make sure there are at least 2 number points.
 4. Feel free to prefix number text with emojis

#### 1.1.1. Supporting Point 1.1.1. of Supporting Point 1.1.

Always add a description after every supporting point. If you cannot determine a proper description, then summarize or paraphrase or tl;dr the supporting points in this section. If this section has no supporting points, then summarize or paraphrase or tl;dr the content in this section you are about to describe.

A document block is a paragraph, bullet list, number list, code, alert, etc.; any formatted group of text that are meant to be together. Document blocks should be separated by an empty line. a properly executed document block looks like the following *(and notice the empty line)*.

```
If code blocks contains code please add the language in the meta area of the code block so it can be colorized.
```

Unlike the title and main point sections, supporting points can have as many paragraphs and document blocks as needed. The following is an example of an alert.

> INFO: Tag alerts like log levels *(INFO, WARNING, ERROR, NOTICE, HINT, TIP)* followed by a colon. You can also add the relative emoji so it looks better.

#### 1.1.2. Supporting Point 1.1.2. of Supporting Point 1.1.

Make sure there is at least 2 supporting points when adding a supporting points to a supporting point. If you cannot determine a second point, then you should move the content of the first point to the parent supporting point.

### 1.2. Supporting Point 1.2. of Main Subject 1

Make sure there is at least 2 supporting points when adding a supporting points to a main subject. If you cannot determine a second point, then you should move the content of the first point to the parent main topic.

Main subjects can also be referred to as "main topics". Supporting points can also be referred as "sub-topics" or "sub topics" or "subtopics". All topic headers should start with an outline ID that is determined using the outline numbering system like this document to it can be easily referenced by those who are reading it. Make sure to end every outline ID with a period *(.)*.

#### 1.2.1. Supporting Point 1.2.1. of Supporting Point 1.2.

Labels like "Example" and "Usage" are not topics. They should just be bolded *(double star)*. Do not make labels headers *(prefixed by hash/pound)*. 

**Examples**

```md
# Topic 1 (❌ Missing Outline Numbering)
## Topic 2 (❌ No Description Between Topics)
❌ No empty lines between headers and document blocks
```

> Labels should also be separated by an empty line.

Try not to go passed 3 levels of topics. For example `1.2.1.1.` implies the 4th topic level. When thinking about creating a fourth topic level consider simply bolding *(like a label)* instead.

#### 1.2.2. Supporting Point 1.2.2. of Supporting Point 1.2.

Do not use multiple empty lines in a row — one is enough.

> Remove consecutive empty lines with just one line.

## 2. Main Subject 2

Make sure there is at least 2 main subjects per document. If you cannot determine a second subject then make a conclusion paragraph that summarizes what was just talked about. When in doubt, use the format of this document as a guide. This document serves both as a guide and an example.

 - Every title and topic must have a description *(1–3 paragraphs)*.
 - A document must have at least 2 main subjects.
 - Use numbers *(1, 2, 3)* for main subjects.
 - Use capital letters *(A, B, C)* for supporting points.
 - Use numbers again *(1, 2, 3)* for sub-supporting points.
 - Do not go beyond 3 topic levels *(1.2.2. is okay, 1.2.1.1. is too deep)*.
 - Always apply the “at least two” rule:
   - If there’s a 1, there must be a 2.
   - If there’s an A, there must be a B.
   - If there’s a bullet or number list, it must have at least 2 items.
 - Bullets:
   - One space before/after the dash *(- Item)*.
   - Short *(1–3 sentences)*.
   - Always at least 2 bullets.
 - Numbered lists:
   - One space after the period *(1. Item)*.
   - Short *(1–3 sentences)*.
   - Always at least 2 items.
 - Document blocks *(paragraphs, lists, code, etc.)* must be separated by one empty line.
 - Code blocks must declare a language *(js, bash, json, etc.)*.
 - Labels like “Example” or “Usage” should be bold text, not headers.
 - Feel free to use bullets or number lists in the conclusion

Lastly, do not to use the terminology discussed in this document (main subjects, supporting points, topics, etc.) to describe areas in the actual documentation. Do not describe how the documentation was structured using these guidelines.