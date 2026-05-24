import {BoardsList} from "@/widgets/boards-list/ui/BoardsList";
import {CreateBoardForm} from "@/features/board/create-board/ui/CreateBoardForm";
import cls from "./HomePage.module.css";

export const HomePage = () => {
    return (
        <main className={cls.boardsWrapper}>
            <CreateBoardForm/>
            <h1>Your Boards</h1>
            <BoardsList/>
        </main>
    );
};
