import {Module} from '@nestjs/common';
import {MembersController} from './members.controller';
import {MembersService} from './members.service';
import {BoardAccessModule} from '../board-access/board-access.module';
import {UsersModule} from '../users/users.module';
import {RealtimeModule} from '../realtime/realtime.module';

@Module({
    imports: [BoardAccessModule, UsersModule, RealtimeModule],
    controllers: [MembersController],
    providers: [MembersService],
})
export class MembersModule {}
