import {BoardPage} from "@/page/board/ui/BoardPage";

const Page = async ({
                        params,
                    }: {
    params: Promise<{ id: string }>
}) => {
    const {id} = await params;
    return <BoardPage id={id}/>
}

export default Page;