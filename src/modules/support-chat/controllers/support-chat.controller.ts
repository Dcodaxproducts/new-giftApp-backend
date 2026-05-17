import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { AuthUserContext, CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Permissions } from '../../../common/decorators/permissions.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { ListSupportChatsDto, ResolveSupportChatDto, SendSupportChatMessageDto } from '../dto/support-chat.dto';
import { SupportChatService } from '../services/support-chat.service';
@ApiTags('02 Admin - Support Chat') @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard) @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN) @Controller('admin/support-chats')
export class SupportChatController { constructor(private readonly chats:SupportChatService) {}
 @Get() @Permissions('supportChats.read') @ApiOperation({summary:'List admin support chats',description:'SUPER_ADMIN sees all. ADMIN sees assigned chats unless granted supportChats.read.all.'}) @ApiQuery({name:'participantType',required:false,enum:['ALL','PROVIDER','REGISTERED_USER']}) @ApiQuery({name:'status',required:false,enum:['ALL','OPEN','ACTIVE','RESOLVED']}) @ApiResponse({status:200,schema:{example:{success:true,data:[{id:'support_chat_id',participant:{id:'provider_id',type:'PROVIDER',name:'Luxe Unboxed',avatarUrl:'https://cdn.example.com/avatar.png'},subject:'Support Ticket',lastMessage:"I've attached the new listing...",lastMessageAt:'2026-05-16T10:00:00.000Z',unreadCount:2,status:'ACTIVE'}],message:'Support chats fetched successfully.'}}}) list(@CurrentUser() user:AuthUserContext,@Query() q:ListSupportChatsDto){return this.chats.list(user,q)}
 @Get('stats') @Permissions('supportChats.read') @ApiOperation({summary:'Fetch support chat stats'}) stats(@CurrentUser() user:AuthUserContext){return this.chats.stats(user)}
 @Get(':id') @Permissions('supportChats.read') @ApiOperation({summary:'Fetch support chat conversation details'}) details(@CurrentUser() user:AuthUserContext,@Param('id') id:string){return this.chats.details(user,id)}
 @Post(':id/messages') @Permissions('supportChats.reply') @ApiOperation({summary:'Reply to support chat',description:'Attachments must be completed uploads in support-chat-attachments folder.'}) @ApiBody({type:SendSupportChatMessageDto,examples:{text:{value:{messageType:'TEXT',body:'I am checking this issue now.',attachmentUrls:[]}}}}) reply(@CurrentUser() user:AuthUserContext,@Param('id') id:string,@Body() dto:SendSupportChatMessageDto){return this.chats.reply(user,id,dto)}
 @Patch(':id/read') @Permissions('supportChats.read') @ApiOperation({summary:'Mark support chat as read'}) read(@CurrentUser() user:AuthUserContext,@Param('id') id:string){return this.chats.markRead(user,id)}
 @Post(':id/resolve') @Permissions('supportChats.resolve') @ApiOperation({summary:'Resolve support chat and notify participant'}) @ApiBody({type:ResolveSupportChatDto}) resolve(@CurrentUser() user:AuthUserContext,@Param('id') id:string,@Body() dto:ResolveSupportChatDto){return this.chats.resolve(user,id,dto)}
 @Post(':id/reopen') @Permissions('supportChats.resolve') @ApiOperation({summary:'Reopen support chat and notify participant'}) @ApiBody({type:ResolveSupportChatDto}) reopen(@CurrentUser() user:AuthUserContext,@Param('id') id:string,@Body() dto:ResolveSupportChatDto){return this.chats.reopen(user,id,dto)}
}
