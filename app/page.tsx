import dynamic from "next/dynamic";

/**
 * disable ssr to avoid pre-rendering issues of Next.js
 * 禁用服务端渲染(SSR)以避免Next.js的预渲染问题
 *
 * we're doing this because we're using a canvas element that can't be pre-rendered by Next.js on the server
 * 这样做是因为我们使用了canvas元素,它无法在Next.js服务器端进行预渲染
 * 
 * 详细流程说明:
 * 1. 使用next/dynamic动态导入App组件
 * 2. 通过{ssr: false}配置禁用服务端渲染
 * 3. 组件将只在客户端渲染,避免canvas相关的SSR问题
 * 4. 这种方式会略微增加首次加载时间,但确保了canvas功能的正常运行
 * 5. dynamic import还可以实现代码分割,减小主包体积
 */
const App = dynamic(() => import("./App"), { ssr: false });

export default App;


// @LiveBlocks @fabric  @components @settings @app @constants @hooks  @lib  @types 