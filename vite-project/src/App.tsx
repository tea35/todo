import { useState, useEffect } from "react";
import localforage from "localforage";
import { isTodos } from "./lib/isTodos";

type Todo = {
  value: string;
  readonly id: number;
  checked: boolean;
  removed: boolean;
};
type Filter = "all" | "checked" | "unchecked" | "removed";

export const App = () => {
  const [text, setText] = useState("");

  const [todos, setTodos] = useState<Todo[]>([]);

  const [filter, setFilter] = useState<Filter>("all");

  const handleFilter = (filter: Filter) => {
    setFilter(filter);
  };
  const filteredTodos = todos.filter((todo) => {
    // filter ステートの値に応じて異なる内容の配列を返す
    switch (filter) {
      case "all":
        // 削除されていないもの
        return !todo.removed;
      case "checked":
        // 完了済 **かつ** 削除されていないもの
        return todo.checked && !todo.removed;
      case "unchecked":
        // 未完了 **かつ** 削除されていないもの
        return !todo.checked && !todo.removed;
      case "removed":
        // 削除済みのもの
        return todo.removed;
      default:
        return todo;
    }
  });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  const handleSubmit = () => {
    if (!text) return;

    const newTodo: Todo = {
      value: text,
      id: new Date().getTime(),
      checked: false,
      removed: false,
    };
    setTodos((todos) => [newTodo, ...todos]);
    setText("");
  };

  const handleTodo = <K extends keyof Todo, V extends Todo[K]>(
    id: number,
    key: K,
    value: V
  ) => {
    setTodos((todos) => {
      const newTodos = todos.map((todo) => {
        if (todo.id === id) {
          return { ...todo, [key]: value };
        } else {
          return todo;
        }
      });
      return newTodos;
    });
  };
  const handleEmpty = () => {
    setTodos((todos) => todos.filter((todo) => !todo.removed));
  };

  useEffect(() => {
    localforage
      .getItem("todo-20200101")
      .then((values) => isTodos(values) && setTodos(values));
  }, []);

  useEffect(() => {
    localforage.setItem("todo-20200101", todos);
  }, [todos]);

  return (
    <div>
      <select
        defaultValue="all"
        onChange={(e) => handleFilter(e.target.value as Filter)}
      >
        <option value="all">全てのタスク</option>
        <option value="checked">完了したタスク</option>
        <option value="unchecked">現在のタスク</option>
        <option value="removed">ゴミ箱</option>
      </select>
      {filter === "removed" ? (
        <button
          onClick={handleEmpty}
          disabled={todos.filter((todo) => todo.removed).length === 0}
        >
          ゴミ箱を空にする
        </button>
      ) : (
        filter !== "checked" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <input type="text" value={text} onChange={(e) => handleChange(e)} />
            <input type="submit" value="追加" onSubmit={handleSubmit} />
          </form>
        )
      )}
      <ul>
        {filteredTodos.map((todo) => {
          return (
            <li key={todo.id}>
              <input
                type="checkbox"
                disabled={todo.removed}
                checked={todo.checked}
                onChange={() => handleTodo(todo.id, "checked", !todo.checked)}
              />
              <input
                type="text"
                disabled={todo.checked || todo.removed}
                value={todo.value}
                onChange={(e) => handleTodo(todo.id, "value", e.target.value)}
              />
              <button
                onClick={() => handleTodo(todo.id, "removed", !todo.removed)}
              >
                {todo.removed ? "復元" : "削除"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default App;
