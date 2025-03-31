const Todo = require("../models/Todo");

// 获取所有待办事项
exports.getAllTodos = async (req, res) => {
    try {
        // 如果实现了用户认证，可以通过 req.user.id 获取用户ID
        // const userId = req.user.id;
        // const todos = await Todo.find({ user: userId });

        const todos = await Todo.find().sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: todos,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "获取待办事项失败",
            error: error.message,
        });
    }
};

// 创建新的待办事项
exports.createTodo = async (req, res) => {
    try {
        const { text, category, priority } = req.body;

        if (!text || !category || !priority) {
            return res.status(400).json({
                success: false,
                message: "请提供完整的待办事项信息",
            });
        }

        // 如果实现了用户认证，可以设置用户ID
        // const todo = new Todo({
        //   ...req.body,
        //   user: req.user.id,
        // });

        const todo = new Todo(req.body);
        await todo.save();

        res.status(201).json({
            success: true,
            data: todo,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "创建待办事项失败",
            error: error.message,
        });
    }
};

// 更新待办事项
exports.updateTodo = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // 如果实现了用户认证，可以检查待办事项是否属于当前用户
        // const todo = await Todo.findOne({ _id: id, user: req.user.id });

        const todo = await Todo.findById(id);

        if (!todo) {
            return res.status(404).json({
                success: false,
                message: "待办事项不存在",
            });
        }

        const updatedTodo = await Todo.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            data: updatedTodo,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "更新待办事项失败",
            error: error.message,
        });
    }
};

// 删除待办事项
exports.deleteTodo = async (req, res) => {
    try {
        const { id } = req.params;

        // 如果实现了用户认证，可以检查待办事项是否属于当前用户
        // const todo = await Todo.findOne({ _id: id, user: req.user.id });

        const todo = await Todo.findById(id);

        if (!todo) {
            return res.status(404).json({
                success: false,
                message: "待办事项不存在",
            });
        }

        await Todo.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "待办事项已删除",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "删除待办事项失败",
            error: error.message,
        });
    }
}; 