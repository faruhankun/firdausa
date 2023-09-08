import { CreatePostModalLauncher } from '@/components/CreatePostModalLauncher';
import { DarkModeSwitch } from '@/components/DarkModeSwitch';
import { Posts } from '@/components/Posts';
import { getServerUser } from '@/lib/getServerUser';

export async function Feed() {
  const [user] = await getServerUser();
  return (
    <div className="px-4 pt-4">
      <div className="mb-4 flex items-center justify-between ">
        <h1 className="text-4xl font-bold">Feed</h1>
        <div>
          <DarkModeSwitch />
        </div>
      </div>
      <CreatePostModalLauncher />
      <Posts type="feed" userId={user?.id!} />
    </div>
  );
}
