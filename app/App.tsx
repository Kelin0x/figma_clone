"use client";

import { fabric } from "fabric";
import { useEffect, useRef, useState } from "react";

import { useMutation, useRedo, useStorage, useUndo } from "@/liveblocks.config";
import {
  handleCanvaseMouseMove,
  handleCanvasMouseDown,
  handleCanvasMouseUp,
  handleCanvasObjectModified,
  handleCanvasObjectMoving,
  handleCanvasObjectScaling,
  handleCanvasSelectionCreated,
  handleCanvasZoom,
  handlePathCreated,
  handleResize,
  initializeFabric,
  renderCanvas,
} from "@/lib/canvas";
import { handleDelete, handleKeyDown } from "@/lib/key-events";
import { LeftSidebar, Live, Navbar, RightSidebar } from "@/components/index";
import { handleImageUpload } from "@/lib/shapes";
import { defaultNavElement } from "@/constants";
import { ActiveElement, Attributes } from "@/types/type";

const Home = () => {
  /**
   * useUndo and useRedo are hooks provided by Liveblocks that allow you to
   * undo and redo mutations.
   * 
   * useUndo和useRedo是Liveblocks提供的钩子，允许你进行撤销和重做操作。
   *
   * useUndo: https://liveblocks.io/docs/api-reference/liveblocks-react#useUndo
   * useRedo: https://liveblocks.io/docs/api-reference/liveblocks-react#useRedo
   */
  const undo = useUndo();
  const redo = useRedo();

  /**
   * useStorage is a hook provided by Liveblocks that allows you to store
   * data in a key-value store and automatically sync it with other users
   * i.e., subscribes to updates to that selected data
   * 
   * useStorage是Liveblocks提供的钩子，允许你在键值存储中存储数据，
   * 并自动与其他用户同步，即订阅所选数据的更新。
   *
   * useStorage: https://liveblocks.io/docs/api-reference/liveblocks-react#useStorage
   *
   * Over here, we are storing the canvas objects in the key-value store.
   * 在这里，我们将画布对象存储在键值存储中。
   */
  const canvasObjects = useStorage((root) => root.canvasObjects);

  /**
   * canvasRef is a reference to the canvas element that we'll use to initialize
   * the fabric canvas.
   * canvasRef是对画布元素的引用，我们将用它来初始化fabric画布。
   *
   * fabricRef is a reference to the fabric canvas that we use to perform
   * operations on the canvas. It's a copy of the created canvas so we can use
   * it outside the canvas event listeners.
   * fabricRef是对fabric画布的引用，我们用它来执行画布操作。
   * 
   * 
   * 它是创建的画布的副本，因此我们可以在画布事件监听器之外使用它。
   * 
   * 这里定义了两个重要的引用(useRef):
   * 1. canvasRef: 
   * - 这是对HTML原生canvas元素的引用
   * - 就像在画画时需要一个画布一样,这是我们最基础的"画布"
   * - 我们需要它来初始化fabric.js的画布(fabric.Canvas)
   * - 可以把它理解为真实的物理画布
   * 
   * 2. fabricRef:
   * - 这是对fabric.js画布对象的引用
   * - fabric.js是一个强大的canvas库,它在原生canvas之上提供了更多功能
   * - 就像画画时除了画布,还需要画笔、颜料等工具
   * - fabricRef就是这些"工具"的集合,它让我们能够:
   *   - 在画布上绘制各种形状
   *   - 移动、缩放、旋转这些形状
   *   - 处理用户的鼠标事件
   *   - 等等...
   * 
   * 为什么要用useRef?
   * - useRef可以在组件重新渲染时保持数据不变
   * - 更新useRef不会触发组件重新渲染
   * - 这对于canvas这种需要保持状态的场景很重要
   */
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  /**
   * isDrawing is a boolean that tells us if the user is drawing on the canvas.
   * We use this to determine if the user is drawing or not
   * i.e., if the freeform drawing mode is on or not.
   * 
   * isDrawing是一个布尔值，告诉我们用户是否正在画布上绘画。
   * 我们用它来判断用户是否正在绘画，即自由绘画模式是否开启。
   */
  const isDrawing = useRef(false);

  /**
   * shapeRef is a reference to the shape that the user is currently drawing.
   * We use this to update the shape's properties when the user is
   * drawing/creating shape
   * 
   * shapeRef是对用户当前正在绘制的形状的引用。
   * 当用户绘制/创建形状时，我们用它来更新形状的属性。
   */
  const shapeRef = useRef<fabric.Object | null>(null);

  /**
   * selectedShapeRef is a reference to the shape that the user has selected.
   * For example, if the user has selected the rectangle shape, then this will
   * be set to "rectangle".
   * 
   * selectedShapeRef是对用户已选择形状的引用。
   * 例如，如果用户选择了矩形形状，那么这将被设置为"rectangle"。
   *
   * We're using refs here because we want to access these variables inside the
   * event listeners. We don't want to lose the values of these variables when
   * the component re-renders. Refs help us with that.
   * 
   * 我们在这里使用refs是因为我们想在事件监听器内部访问这些变量。
   * 我们不希望在组件重新渲染时丢失这些变量的值。Refs帮助我们实现这一点。
   */
  /**
   * 为什么使用useRef重新渲染不会丢失数据?
   * 
   * 1. useRef的特性:
   * - useRef返回一个可变的ref对象,这个对象在组件的整个生命周期内保持不变
   * - ref对象的.current属性可以被修改,且修改不会触发组件重新渲染
   * - 即使组件重新渲染,ref对象仍然指向同一个内存地址
   * 
   * 2. 与useState的区别:
   * - useState的值在每次渲染时都会创建新的副本
   * - 修改useState的值会触发组件重新渲染
   * - 重新渲染时useState会保留最新的状态值
   * 
   * 3. useRef的使用场景:
   * - 存储不需要触发重新渲染的可变值(如定时器ID、DOM节点引用等)
   * - 需要在事件处理函数中访问最新值
   * - 需要在副作用中保持状态但不触发重新渲染
   * 
   * 4. 在Canvas场景中:
   * - Canvas操作频繁,使用useState会导致大量不必要的重新渲染
   * - 需要在事件监听器中访问最新的绘图状态
   * - 绘图状态的更新不需要触发UI更新
   * 
   * 因此,useRef是存储这类可变状态的理想选择。
   */
  const selectedShapeRef = useRef<string | null>(null);

  /**
   * activeObjectRef is a reference to the active/selected object in the canvas
   * activeObjectRef是对画布中活动/选中对象的引用
   *
   * We want to keep track of the active object so that we can keep it in
   * selected form when user is editing the width, height, color etc
   * properties/attributes of the object.
   * 
   * 我们想要跟踪活动对象，以便在用户编辑对象的宽度、高度、颜色等
   * 属性时保持其选中状态。
   *
   * Since we're using live storage to sync shapes across users in real-time,
   * we have to re-render the canvas when the shapes are updated.
   * Due to this re-render, the selected shape is lost. We want to keep track
   * of the selected shape so that we can keep it selected when the
   * canvas re-renders.
   * 
   * 由于我们使用实时存储在用户之间同步形状，
   * 当形状更新时我们必须重新渲染画布。
   * 由于这种重新渲染，选中的形状会丢失。
   * 我们想要跟踪选中的形状，以便在画布重新渲染时保持其选中状态。
   */
  const activeObjectRef = useRef<fabric.Object | null>(null);
  /**
   * isEditingRef用于跟踪文本对象是否处于编辑状态
   * 
   * 1. 作用说明:
   * - 用于标记画布中的文本对象是否正在被编辑
   * - 值为布尔类型,true表示正在编辑,false表示未在编辑
   * - 通过useRef创建确保在重渲染时保持状态
   * 
   * 2. 使用场景:
   * - 在文本编辑开始时设置为true
   * - 在文本编辑结束时设置为false 
   * - 用于控制其他画布操作是否可执行
   * - 防止在文本编辑时触发不必要的画布事件
   * 
   * 3. 为什么使用useRef:
   * - 编辑状态的改变不需要触发组件重渲染
   * - 需要在事件处理函数中随时访问最新的编辑状态
   * - 确保在组件生命周期内保持状态一致性
   */
  const isEditingRef = useRef(false);

  /**
   * imageInputRef is a reference to the input element that we use to upload
   * an image to the canvas.
   * 
   * imageInputRef是对我们用来上传图片到画布的input元素的引用。
   *
   * We want image upload to happen when clicked on the image item from the
   * dropdown menu. So we're using this ref to trigger the click event on the
   * input element when the user clicks on the image item from the dropdown.
   * 
   * 我们希望在从下拉菜单点击图片项时进行图片上传。
   * 因此，当用户从下拉菜单点击图片项时，
   * 我们使用这个ref来触发input元素的点击事件。
   */
  const imageInputRef = useRef<HTMLInputElement>(null);

  /**
   * activeElement is an object that contains the name, value and icon of the
   * active element in the navbar.
   * 
   * activeElement是一个包含导航栏中活动元素的名称、值和图标的对象。
   */
  const [activeElement, setActiveElement] = useState<ActiveElement>({
    name: "",
    value: "",
    icon: "",
  });

  /**
   * elementAttributes is an object that contains the attributes of the selected
   * element in the canvas.
   * 
   * elementAttributes是一个包含画布中选中元素属性的对象。
   *
   * We use this to update the attributes of the selected element when the user
   * is editing the width, height, color etc properties/attributes of the
   * object.
   * 
   * 当用户编辑对象的宽度、高度、颜色等属性时，
   * 我们使用它来更新选中元素的属性。
   */
  const [elementAttributes, setElementAttributes] = useState<Attributes>({
    width: "",
    height: "",
    fontSize: "",
    fontFamily: "",
    fontWeight: "",
    fill: "#aabbcc",
    stroke: "#aabbcc",
  });

  /**
   * deleteShapeFromStorage is a mutation that deletes a shape from the
   * key-value store of liveblocks.
   * 
   * deleteShapeFromStorage是一个从liveblocks键值存储中删除形状的mutation。
   * 
   * useMutation is a hook provided by Liveblocks that allows you to perform
   * mutations on liveblocks data.
   * 
   * useMutation是Liveblocks提供的一个钩子，允许你对liveblocks数据执行mutations。
   *
   * useMutation: https://liveblocks.io/docs/api-reference/liveblocks-react#useMutation
   * delete: https://liveblocks.io/docs/api-reference/liveblocks-client#LiveMap.delete
   * get: https://liveblocks.io/docs/api-reference/liveblocks-client#LiveMap.get
   *
   * We're using this mutation to delete a shape from the key-value store when
   * the user deletes a shape from the canvas.
   * 
   * 当用户从画布删除形状时，我们使用这个mutation从键值存储中删除形状。
   */
  const deleteShapeFromStorage = useMutation(({ storage }, shapeId) => {
    /**
     * canvasObjects is a Map that contains all the shapes in the key-value.
     * Like a store. We can create multiple stores in liveblocks.
     * 
     * canvasObjects是一个包含键值中所有形状的Map。
     * 像一个存储。我们可以在liveblocks中创建多个存储。
     *
     * delete: https://liveblocks.io/docs/api-reference/liveblocks-client#LiveMap.delete
     */
    const canvasObjects = storage.get("canvasObjects");
    canvasObjects.delete(shapeId);
  }, []);

  /**
   * deleteAllShapes is a mutation that deletes all the shapes from the
   * key-value store of liveblocks.
   * 
   * deleteAllShapes是一个从liveblocks键值存储中删除所有形状的mutation。
   *
   * delete: https://liveblocks.io/docs/api-reference/liveblocks-client#LiveMap.delete
   * get: https://liveblocks.io/docs/api-reference/liveblocks-client#LiveMap.get
   *
   * We're using this mutation to delete all the shapes from the key-value store when the user clicks on the reset button.
   * 
   * 当用户点击重置按钮时，我们使用这个mutation从键值存储中删除所有形状。
   */
  const deleteAllShapes = useMutation(({ storage }) => {
    // get the canvasObjects store
    // 获取canvasObjects存储
    const canvasObjects = storage.get("canvasObjects");

    // if the store doesn't exist or is empty, return
    // 如果存储不存在或为空，则返回
    if (!canvasObjects || canvasObjects.size === 0) return true;

    // delete all the shapes from the store
    // 从存储中删除所有形状
    for (const [key, value] of canvasObjects.entries()) {
      canvasObjects.delete(key);
    }

    // return true if the store is empty
    // 如果存储为空则返回true
    return canvasObjects.size === 0;
  }, []);

  /**
   * syncShapeInStorage is a mutation that syncs the shape in the key-value
   * store of liveblocks.
   * 
   * syncShapeInStorage是一个在liveblocks键值存储中同步形状的mutation。
   *
   * We're using this mutation to sync the shape in the key-value store
   * whenever user performs any action on the canvas such as drawing, moving
   * editing, deleting etc.
   * 
   * 当用户在画布上执行任何操作（如绘制、移动、编辑、删除等）时，
   * 我们使用这个mutation来同步键值存储中的形状。
   */
  const syncShapeInStorage = useMutation(({ storage }, object) => {
    // if the passed object is null, return
    // 如果传入的对象为null，则返回
    if (!object) return;
    const { objectId } = object;

    /**
     * Turn Fabric object (kclass) into JSON format so that we can store it in the
     * key-value store.
     * 
     * 将Fabric对象（kclass）转换为JSON格式，以便我们可以将其存储在键值存储中。
     */
    const shapeData = object.toJSON();
    shapeData.objectId = objectId;

    const canvasObjects = storage.get("canvasObjects");
    /**
     * set is a method provided by Liveblocks that allows you to set a value
     * set是Liveblocks提供的一个方法，允许你设置一个值
     *
     * set: https://liveblocks.io/docs/api-reference/liveblocks-client#LiveMap.set
     */
    canvasObjects.set(objectId, shapeData);
  }, []);

  /**
   * Set the active element in the navbar and perform the action based
   * on the selected element.
   * 
   * 设置导航栏中的活动元素，并根据选中的元素执行操作。
   *
   * @param elem
   */
  const handleActiveElement = (elem: ActiveElement) => {
    setActiveElement(elem);

    switch (elem?.value) {
      // delete all the shapes from the canvas
      // 从画布删除所有形状
      case "reset":
        // clear the storage
        // 清除存储
        deleteAllShapes();
        // clear the canvas
        // 清除画布
        fabricRef.current?.clear();
        // set "select" as the active element
        // 将"select"设置为活动元素
        setActiveElement(defaultNavElement);
        break;

      // delete the selected shape from the canvas
      // 从画布删除选中的形状
      case "delete":
        // delete it from the canvas
        // 从画布中删除它
        handleDelete(fabricRef.current as any, deleteShapeFromStorage);
        // set "select" as the active element
        // 将"select"设置为活动元素
        setActiveElement(defaultNavElement);
        break;

      // upload an image to the canvas
      // 上传图片到画布
      case "image":
        // trigger the click event on the input element which opens the file dialog
        // 触发input元素的点击事件，打开文件对话框
        imageInputRef.current?.click();
        /**
         * set drawing mode to false
         * If the user is drawing on the canvas, we want to stop the
         * drawing mode when clicked on the image item from the dropdown.
         * 
         * 设置绘画模式为false
         * 如果用户正在画布上绘画，当从下拉菜单点击图片项时，
         * 我们想要停止绘画模式。
         */
        isDrawing.current = false;

        if (fabricRef.current) {
          // disable the drawing mode of canvas
          // 禁用画布的绘画模式
          fabricRef.current.isDrawingMode = false;
        }
        break;

      // for comments, do nothing
      // 对于注释，不做任何操作
      case "comments":
        break;

      default:
        // set the selected shape to the selected element
        // 将选中的形状设置为选中的元素
        selectedShapeRef.current = elem?.value as string;
        break;
    }
  };

  useEffect(() => {
    // initialize the fabric canvas
    // 初始化fabric画布
    const canvas = initializeFabric({
      canvasRef,
      fabricRef,
    });

    /**
     * listen to the mouse down event on the canvas which is fired when the
     * user clicks on the canvas
     * 
     * 监听画布上的鼠标按下事件，当用户点击画布时触发
     *
     * Event inspector: http://fabricjs.com/events
     * Event list: http://fabricjs.com/docs/fabric.Canvas.html#fire
     */
    canvas.on("mouse:down", (options) => {
      handleCanvasMouseDown({
        options,
        canvas,
        selectedShapeRef,
        isDrawing,
        shapeRef,
      });
    });

    /**
     * listen to the mouse move event on the canvas which is fired when the
     * user moves the mouse on the canvas
     * 
     * 监听画布上的鼠标移动事件，当用户在画布上移动鼠标时触发
     *
     * Event inspector: http://fabricjs.com/events
     * Event list: http://fabricjs.com/docs/fabric.Canvas.html#fire
     */
    canvas.on("mouse:move", (options) => {
      handleCanvaseMouseMove({
        options,
        canvas,
        isDrawing,
        selectedShapeRef,
        shapeRef,
        syncShapeInStorage,
      });
    });

    /**
     * listen to the mouse up event on the canvas which is fired when the
     * user releases the mouse on the canvas
     * 
     * 监听画布上的鼠标释放事件，当用户在画布上释放鼠标时触发
     *
     * Event inspector: http://fabricjs.com/events
     * Event list: http://fabricjs.com/docs/fabric.Canvas.html#fire
     */
    canvas.on("mouse:up", () => {
      handleCanvasMouseUp({
        canvas,
        isDrawing,
        shapeRef,
        activeObjectRef,
        selectedShapeRef,
        syncShapeInStorage,
        setActiveElement,
      });
    });

    /**
     * listen to the path created event on the canvas which is fired when
     * the user creates a path on the canvas using the freeform drawing
     * mode
     * 
     * 监听画布上的路径创建事件，当用户使用自由绘画模式在画布上创建路径时触发
     *
     * Event inspector: http://fabricjs.com/events
     * Event list: http://fabricjs.com/docs/fabric.Canvas.html#fire
     */
    canvas.on("path:created", (options) => {
      handlePathCreated({
        options,
        syncShapeInStorage,
      });
    });

    /**
     * listen to the object modified event on the canvas which is fired
     * when the user modifies an object on the canvas. Basically, when the
     * user changes the width, height, color etc properties/attributes of
     * the object or moves the object on the canvas.
     * 
     * 监听画布上的对象修改事件，当用户修改画布上的对象时触发。
     * 基本上，当用户更改对象的宽度、高度、颜色等属性或在画布上移动对象时。
     *
     * Event inspector: http://fabricjs.com/events
     * Event list: http://fabricjs.com/docs/fabric.Canvas.html#fire
     */
    canvas.on("object:modified", (options) => {
      handleCanvasObjectModified({
        options,
        syncShapeInStorage,
      });
    });

    /**
     * listen to the object moving event on the canvas which is fired
     * when the user moves an object on the canvas.
     * 
     * 监听画布上的对象移动事件，当用户在画布上移动对象时触发。
     *
     * Event inspector: http://fabricjs.com/events
     * Event list: http://fabricjs.com/docs/fabric.Canvas.html#fire
     */
    canvas?.on("object:moving", (options) => {
      handleCanvasObjectMoving({
        options,
      });
    });

    /**
     * listen to the selection created event on the canvas which is fired
     * when the user selects an object on the canvas.
     * 
     * 监听画布上的选择创建事件，当用户在画布上选择对象时触发。
     *
     * Event inspector: http://fabricjs.com/events
     * Event list: http://fabricjs.com/docs/fabric.Canvas.html#fire
     */
    canvas.on("selection:created", (options) => {
      handleCanvasSelectionCreated({
        options,
        isEditingRef,
        setElementAttributes,
      });
    });

    /**
     * listen to the scaling event on the canvas which is fired when the
     * user scales an object on the canvas.
     * 
     * 监听画布上的缩放事件，当用户在画布上缩放对象时触发。
     *
     * Event inspector: http://fabricjs.com/events
     * Event list: http://fabricjs.com/docs/fabric.Canvas.html#fire
     */
    canvas.on("object:scaling", (options) => {
      handleCanvasObjectScaling({
        options,
        setElementAttributes,
      });
    });

    /**
     * listen to the mouse wheel event on the canvas which is fired when
     * the user scrolls the mouse wheel on the canvas.
     * 
     * 监听画布上的鼠标滚轮事件，当用户在画布上滚动鼠标滚轮时触发。
     *
     * Event inspector: http://fabricjs.com/events
     * Event list: http://fabricjs.com/docs/fabric.Canvas.html#fire
     */
    canvas.on("mouse:wheel", (options) => {
      handleCanvasZoom({
        options,
        canvas,
      });
    });

    /**
     * listen to the resize event on the window which is fired when the
     * user resizes the window.
     * 
     * 监听窗口上的调整大小事件，当用户调整窗口大小时触发。
     *
     * We're using this to resize the canvas when the user resizes the
     * window.
     * 
     * 我们使用这个来在用户调整窗口大小时调整画布大小。
     */
    window.addEventListener("resize", () => {
      handleResize({
        canvas: fabricRef.current,
      });
    });

    /**
     * listen to the key down event on the window which is fired when the
     * user presses a key on the keyboard.
     * 
     * 监听窗口上的按键事件，当用户按下键盘上的键时触发。
     *
     * We're using this to perform some actions like delete, copy, paste, etc when the user presses the respective keys on the keyboard.
     * 
     * 我们使用这个来在用户按下相应的键时执行一些操作，如删除、复制、粘贴等。
     */
    window.addEventListener("keydown", (e) =>
      handleKeyDown({
        e,
        canvas: fabricRef.current,
        undo,
        redo,
        syncShapeInStorage,
        deleteShapeFromStorage,
      })
    );

    // dispose the canvas and remove the event listeners when the component unmounts
    // 当组件卸载时处理画布并移除事件监听器
    return () => {
      /**
       * dispose is a method provided by Fabric that allows you to dispose
       * the canvas. It clears the canvas and removes all the event
       * listeners
       * 
       * dispose是Fabric提供的一个方法，允许你处理画布。
       * 它清除画布并移除所有事件监听器
       *
       * dispose: http://fabricjs.com/docs/fabric.Canvas.html#dispose
       */
      canvas.dispose();

      // remove the event listeners
      // 移除事件监听器
      window.removeEventListener("resize", () => {
        handleResize({
          canvas: null,
        });
      });

      window.removeEventListener("keydown", (e) =>
        handleKeyDown({
          e,
          canvas: fabricRef.current,
          undo,
          redo,
          syncShapeInStorage,
          deleteShapeFromStorage,
        })
      );
    };
  }, [canvasRef]); // run this effect only once when the component mounts and the canvasRef changes
                   // 仅在组件挂载和canvasRef更改时运行此效果一次

  // render the canvas when the canvasObjects from live storage changes
  // 当实时存储中的canvasObjects更改时渲染画布
  useEffect(() => {
    renderCanvas({
      fabricRef,
      canvasObjects,
      activeObjectRef,
    });
  }, [canvasObjects]);

  return (
    <main className='h-screen overflow-hidden'>
      <Navbar
        imageInputRef={imageInputRef}
        activeElement={activeElement}
        handleImageUpload={(e: any) => {
          // prevent the default behavior of the input element
          // 阻止input元素的默认行为
          e.stopPropagation();

          handleImageUpload({
            file: e.target.files[0],
            canvas: fabricRef as any,
            shapeRef,
            syncShapeInStorage,
          });
        }}
        handleActiveElement={handleActiveElement}
      />

      <section className='flex h-full flex-row'>
        <LeftSidebar allShapes={Array.from(canvasObjects)} />

        <Live canvasRef={canvasRef} undo={undo} redo={redo} />

        <RightSidebar
          elementAttributes={elementAttributes}
          setElementAttributes={setElementAttributes}
          fabricRef={fabricRef}
          isEditingRef={isEditingRef}
          activeObjectRef={activeObjectRef}
          syncShapeInStorage={syncShapeInStorage}
        />
      </section>
    </main>
  );
};

export default Home;
