// 此文件由 npm run generate:api 自动生成，请勿手动修改。
export interface paths {
  '/health': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['health_check_api_v1_health_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/auth/login': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['login_api_v1_auth_login_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/auth/logout': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u767B\u51FA\u5F53\u524D\u7528\u6237_api_v1_auth_logout_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/auth/device/login': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['login_device_api_v1_auth_device_login_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/auth/device/token': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u521B\u5EFA\u684C\u9762\u7AEF\u4EE4\u724C_api_v1_auth_device_token_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/auth/device/logout': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['logout_device_api_v1_auth_device_logout_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/auth/device/sessions': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u5217\u51FA\u8BBE\u5907\u4F1A\u8BDD_api_v1_auth_device_sessions_get']
    put?: never
    post?: never
    delete: operations['\u5220\u9664\u5168\u90E8\u8BBE\u5907\u4F1A\u8BDD_api_v1_auth_device_sessions_delete']
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/auth/device/sessions/{session_id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post?: never
    delete: operations['\u5220\u9664\u8BBE\u5907\u4F1A\u8BDD_api_v1_auth_device_sessions__session_id__delete']
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/auth/mcp/token': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u521B\u5EFAMCP\u4EE4\u724C_api_v1_auth_mcp_token_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/ai/chat': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['AI\u804A\u5929_api_v1_ai_chat_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/ai/settings': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u83B7\u53D6AI\u8BBE\u7F6E_api_v1_ai_settings_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch: operations['\u4FDD\u5B58AI\u8BBE\u7F6E_api_v1_ai_settings_patch']
    trace?: never
  }
  '/ai/secret': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch: operations['\u4FDD\u5B58AI\u5BC6\u94A5_api_v1_ai_secret_patch']
    trace?: never
  }
  '/ai/test': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u6D4B\u8BD5AI\u914D\u7F6E_api_v1_ai_test_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/ai/logs': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u83B7\u53D6AI\u8C03\u7528\u65E5\u5FD7_api_v1_ai_logs_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/calendar/years/{year}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u83B7\u53D6\u8282\u5047\u65E5\u65E5\u5386\u5E74\u4EFD_api_v1_calendar_years__year__get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/users/me': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['get_me_api_v1_users_me_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch: operations['update_me_api_v1_users_me_patch']
    trace?: never
  }
  '/users/me/password': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch: operations['\u4FEE\u6539\u6211\u7684\u5BC6\u7801_api_v1_users_me_password_patch']
    trace?: never
  }
  '/articles/ai/suggest-metadata': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u5EFA\u8BAE\u6587\u7AE0\u5143\u4FE1\u606F_api_v1_articles_ai_suggest_metadata_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/articles/ai/polish-content': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['AI\u6DA6\u8272\u6587\u7AE0\u6B63\u6587_api_v1_articles_ai_polish_content_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/articles/{article_id}/images/{image_id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post?: never
    delete: operations['\u5220\u9664\u6587\u7AE0\u56FE\u7247_api_v1_articles__article_id__images__image_id__delete']
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/articles/all-meta': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['list_all_meta_api_v1_articles_all_meta_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/articles': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u5217\u51FA\u6587\u7AE0_api_v1_articles_get']
    put?: never
    post: operations['\u521B\u5EFA\u6587\u7AE0_api_v1_articles_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/articles/my/list': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u5217\u51FA\u6211\u7684\u6587\u7AE0_api_v1_articles_my_list_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/articles/my/categories': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u5217\u51FA\u6211\u7684\u6587\u7AE0\u5206\u7C7B_api_v1_articles_my_categories_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/articles/my/{article_id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u83B7\u53D6\u6211\u7684\u6587\u7AE0_api_v1_articles_my__article_id__get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/articles/my/{article_id}/convert/todo': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u6587\u7AE0\u8F6C\u5F85\u529E_api_v1_articles_my__article_id__convert_todo_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/articles/my/{article_id}/convert/material': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u6587\u7AE0\u8F6C\u8D44\u6599_api_v1_articles_my__article_id__convert_material_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/articles/blog/manage': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u7BA1\u7406\u535A\u5BA2\u5217\u8868_api_v1_articles_blog_manage_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/articles/blog/{article_id}/snapshot': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u9884\u89C8\u535A\u5BA2\u5FEB\u7167_api_v1_articles_blog__article_id__snapshot_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/articles/blog/{article_id}/publish': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u53D1\u5E03\u535A\u5BA2\u5FEB\u7167_api_v1_articles_blog__article_id__publish_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/articles/blog/{article_id}/visibility': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch: operations['\u66F4\u65B0\u535A\u5BA2\u53EF\u89C1\u6027_api_v1_articles_blog__article_id__visibility_patch']
    trace?: never
  }
  '/articles/blog/{article_id}/withdraw': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u64A4\u4E0B\u535A\u5BA2_api_v1_articles_blog__article_id__withdraw_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/articles/{slug}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['get_article_api_v1_articles__slug__get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/articles/{slug}/like': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['like_article_api_v1_articles__slug__like_post']
    delete: operations['unlike_article_api_v1_articles__slug__like_delete']
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/articles/{slug}/related': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u83B7\u53D6\u6587\u7AE0\u76F8\u5173_api_v1_articles__slug__related_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/articles/draft': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u521B\u5EFA\u6587\u7AE0\u8349\u7A3F_api_v1_articles_draft_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/articles/{article_id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post?: never
    delete: operations['\u5220\u9664\u6587\u7AE0_api_v1_articles__article_id__delete']
    options?: never
    head?: never
    patch: operations['\u66F4\u65B0\u6587\u7AE0_api_v1_articles__article_id__patch']
    trace?: never
  }
  '/articles/{article_id}/images': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u4E0A\u4F20\u6587\u7AE0\u56FE\u7247_api_v1_articles__article_id__images_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/articles/my/{article_id}/images': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u5217\u51FA\u6587\u7AE0\u56FE\u7247_api_v1_articles_my__article_id__images_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/articles/{article_id}/restore': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u6062\u590D\u6587\u7AE0_api_v1_articles__article_id__restore_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/categories': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u5217\u51FA\u5206\u7C7B_api_v1_categories_get']
    put?: never
    post: operations['\u521B\u5EFA\u5206\u7C7B_api_v1_categories_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/categories/all': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u5217\u51FA\u5168\u90E8\u5206\u7C7B_api_v1_categories_all_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/categories/{category_id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post?: never
    delete: operations['\u5220\u9664\u5206\u7C7B_api_v1_categories__category_id__delete']
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/tags': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u5217\u51FA\u6807\u7B7E_api_v1_tags_get']
    put?: never
    post: operations['\u521B\u5EFA\u6807\u7B7E_api_v1_tags_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/tags/all': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u5217\u51FA\u5168\u90E8\u6807\u7B7E_api_v1_tags_all_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/tags/{tag_id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post?: never
    delete: operations['\u5220\u9664\u6807\u7B7E_api_v1_tags__tag_id__delete']
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/materials/tags': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u5217\u51FA\u8D44\u6599\u6807\u7B7E_api_v1_materials_tags_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/materials': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u5217\u51FA\u8D44\u6599_api_v1_materials_get']
    put?: never
    post: operations['\u521B\u5EFA\u8D44\u6599_api_v1_materials_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/materials/{material_id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['get_material_api_v1_materials__material_id__get']
    put?: never
    post?: never
    delete: operations['\u5220\u9664\u8D44\u6599_api_v1_materials__material_id__delete']
    options?: never
    head?: never
    patch: operations['\u66F4\u65B0\u8D44\u6599_api_v1_materials__material_id__patch']
    trace?: never
  }
  '/materials/{material_id}/restore': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u6062\u590D\u8D44\u6599_api_v1_materials__material_id__restore_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/materials/batch/status': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u6279\u91CF\u66F4\u65B0\u8D44\u6599\u72B6\u6001_api_v1_materials_batch_status_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/todos/tags': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['list_todo_tags_api_v1_todos_tags_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/todos': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['list_todos_api_v1_todos_get']
    put?: never
    post: operations['create_todo_api_v1_todos_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/todos/{todo_id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post?: never
    delete: operations['delete_todo_api_v1_todos__todo_id__delete']
    options?: never
    head?: never
    patch: operations['update_todo_api_v1_todos__todo_id__patch']
    trace?: never
  }
  '/todos/{todo_id}/toggle-pin': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['toggle_pin_api_v1_todos__todo_id__toggle_pin_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/todos/{todo_id}/complete': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['complete_todo_api_v1_todos__todo_id__complete_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/todos/{todo_id}/uncomplete': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u53D6\u6D88\u5B8C\u6210\u5F85\u529E_api_v1_todos__todo_id__uncomplete_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/todos/{todo_id}/restore': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['restore_todo_api_v1_todos__todo_id__restore_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/bills/accounts': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u83B7\u53D6\u8D26\u5355\u8D26\u6237\u5217\u8868_api_v1_bills_accounts_get']
    put?: never
    post: operations['\u521B\u5EFA\u8D26\u5355\u8D26\u6237_api_v1_bills_accounts_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/bills/accounts/{account_id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post?: never
    delete: operations['remove_bill_account_api_v1_bills_accounts__account_id__delete']
    options?: never
    head?: never
    patch: operations['patch_bill_account_api_v1_bills_accounts__account_id__patch']
    trace?: never
  }
  '/bills/categories': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u83B7\u53D6\u8D26\u5355\u5206\u7C7B\u5217\u8868_api_v1_bills_categories_get']
    put?: never
    post: operations['\u521B\u5EFA\u8D26\u5355\u5206\u7C7B_api_v1_bills_categories_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/bills/categories/{category_id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post?: never
    delete: operations['\u79FB\u9664\u8D26\u5355\u5206\u7C7B_api_v1_bills_categories__category_id__delete']
    options?: never
    head?: never
    patch: operations['patch_bill_category_api_v1_bills_categories__category_id__patch']
    trace?: never
  }
  '/bills/templates': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u83B7\u53D6\u8D26\u5355\u6A21\u677F\u5217\u8868_api_v1_bills_templates_get']
    put?: never
    post: operations['\u521B\u5EFA\u8D26\u5355\u6A21\u677F_api_v1_bills_templates_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/bills/templates/{template_id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post?: never
    delete: operations['\u79FB\u9664\u8D26\u5355\u6A21\u677F_api_v1_bills_templates__template_id__delete']
    options?: never
    head?: never
    patch: operations['patch_bill_template_api_v1_bills_templates__template_id__patch']
    trace?: never
  }
  '/bills/templates/generate': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u751F\u6210\u8D26\u5355\u6A21\u677F\u63A5\u53E3_api_v1_bills_templates_generate_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/bills/records': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u83B7\u53D6\u8D26\u5355\u8BB0\u5F55\u5217\u8868_api_v1_bills_records_get']
    put?: never
    post: operations['\u521B\u5EFA\u8D26\u5355\u8BB0\u5F55_api_v1_bills_records_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/bills/records/{record_id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post?: never
    delete: operations['remove_bill_record_api_v1_bills_records__record_id__delete']
    options?: never
    head?: never
    patch: operations['patch_bill_record_api_v1_bills_records__record_id__patch']
    trace?: never
  }
  '/bills/summary': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['get_month_summary_api_v1_bills_summary_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/files/explorer': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u83B7\u53D6\u8D44\u6E90\u7BA1\u7406\u5668\u6570\u636E_api_v1_files_explorer_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/files/search': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u641C\u7D22\u8D44\u6E90_api_v1_files_search_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/files/trash': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u5217\u51FA\u56DE\u6536\u7AD9\u8D44\u6E90_api_v1_files_trash_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/files/archive/download': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u4E0B\u8F7D\u5F52\u6863_api_v1_files_archive_download_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/files': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u4E0A\u4F20\u6587\u4EF6_api_v1_files_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/files/folders': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u521B\u5EFA\u6587\u4EF6\u5939_api_v1_files_folders_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/files/folders/{folder_id}/rename': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch: operations['\u91CD\u547D\u540D\u6587\u4EF6\u5939_api_v1_files_folders__folder_id__rename_patch']
    trace?: never
  }
  '/files/folders/{folder_id}/move': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch: operations['\u79FB\u52A8\u6587\u4EF6\u5939_api_v1_files_folders__folder_id__move_patch']
    trace?: never
  }
  '/files/folders/{folder_id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post?: never
    delete: operations['\u5220\u9664\u6587\u4EF6\u5939_api_v1_files_folders__folder_id__delete']
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/files/folders/{folder_id}/restore': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u6062\u590D\u6587\u4EF6\u5939_api_v1_files_folders__folder_id__restore_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/files/folders/{folder_id}/purge': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post?: never
    delete: operations['\u5F7B\u5E95\u5220\u9664\u6587\u4EF6\u5939_api_v1_files_folders__folder_id__purge_delete']
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/files/{file_id}/move': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch: operations['\u79FB\u52A8\u6587\u4EF6_api_v1_files__file_id__move_patch']
    trace?: never
  }
  '/files/{file_id}/rename': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch: operations['\u91CD\u547D\u540D\u6587\u4EF6_api_v1_files__file_id__rename_patch']
    trace?: never
  }
  '/files/{file_id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post?: never
    delete: operations['\u5220\u9664\u6587\u4EF6_api_v1_files__file_id__delete']
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/files/{file_id}/restore': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u6062\u590D\u6587\u4EF6_api_v1_files__file_id__restore_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/files/{file_id}/purge': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post?: never
    delete: operations['\u5F7B\u5E95\u5220\u9664\u6587\u4EF6_api_v1_files__file_id__purge_delete']
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/media/types': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u5217\u51FA\u6587\u5A31\u7C7B\u578B_api_v1_media_types_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/media/genres': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u5217\u51FA\u6587\u5A31\u5B50\u5206\u7C7B_api_v1_media_genres_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/media/tags': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u5217\u51FA\u6587\u5A31\u6807\u7B7E_api_v1_media_tags_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/media/personal-tags': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u5217\u51FA\u6587\u5A31\u4E2A\u4EBA\u6807\u7B7E_api_v1_media_personal_tags_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/media/creators': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u5217\u51FA\u6587\u5A31\u521B\u4F5C\u8005\u5EFA\u8BAE_api_v1_media_creators_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/media': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u5217\u51FA\u6587\u5A31_api_v1_media_get']
    put?: never
    post: operations['\u521B\u5EFA\u6587\u5A31_api_v1_media_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/media/external/search': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u641C\u7D22\u5916\u90E8\u6587\u5A31_api_v1_media_external_search_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/media/external/{provider}/{external_id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u83B7\u53D6\u5916\u90E8\u6587\u5A31\u8BE6\u60C5_api_v1_media_external__provider___external_id__get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/media/import': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u4ECE\u5916\u90E8\u5019\u9009\u5BFC\u5165\u6587\u5A31_api_v1_media_import_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/media/public': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u5217\u51FA\u516C\u5F00\u6587\u5A31_api_v1_media_public_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/media/public/{media_id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u83B7\u53D6\u516C\u5F00\u6587\u5A31\u8BE6\u60C5_api_v1_media_public__media_id__get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/media/{media_id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u83B7\u53D6\u6587\u5A31\u8BE6\u60C5_api_v1_media__media_id__get']
    put?: never
    post?: never
    delete: operations['\u5220\u9664\u6587\u5A31_api_v1_media__media_id__delete']
    options?: never
    head?: never
    patch: operations['\u66F4\u65B0\u6587\u5A31_api_v1_media__media_id__patch']
    trace?: never
  }
  '/media/{media_id}/assets/import-cover': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u4ECE\u5916\u90E8URL\u5BFC\u5165\u5C01\u9762_api_v1_media__media_id__assets_import_cover_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/media/{media_id}/assets/upload-cover': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u4E0A\u4F20\u672C\u5730\u5C01\u9762_api_v1_media__media_id__assets_upload_cover_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/media/{media_id}/restore': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u6062\u590D\u6587\u5A31_api_v1_media__media_id__restore_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/stats/blog': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['blog_stats_api_v1_stats_blog_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/stats/dashboard': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['dashboard_stats_api_v1_stats_dashboard_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/stats/todos/completion-history': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['todo_completion_history_api_v1_stats_todos_completion_history_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/stats/pageview': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['post_pageview_api_v1_stats_pageview_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/system/status': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['system_status_api_v1_system_status_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/system/public-settings': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u83B7\u53D6\u516C\u5F00\u8BBE\u7F6E_api_v1_system_public_settings_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/system/settings': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['get_settings_api_v1_system_settings_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch: operations['patch_settings_api_v1_system_settings_patch']
    trace?: never
  }
  '/system/twikoo/password': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u83B7\u53D6Twikoo\u5BC6\u7801_api_v1_system_twikoo_password_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/system/twikoo/password/reset': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u91CD\u7F6ETwikoo\u5BC6\u7801\u63A5\u53E3_api_v1_system_twikoo_password_reset_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/widget/summary': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['widget_summary_api_v1_widget_summary_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/announcements/public': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u83B7\u53D6\u516C\u5F00\u516C\u544A_api_v1_announcements_public_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/announcements/public/latest': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u83B7\u53D6\u6700\u65B0\u516C\u544A_api_v1_announcements_public_latest_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/announcements': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u5217\u51FA\u516C\u544A_api_v1_announcements_get']
    put?: never
    post: operations['\u521B\u5EFA\u516C\u544A_api_v1_announcements_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/announcements/{announcement_id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u83B7\u53D6\u516C\u544A_api_v1_announcements__announcement_id__get']
    put?: never
    post?: never
    delete: operations['\u5220\u9664\u516C\u544A_api_v1_announcements__announcement_id__delete']
    options?: never
    head?: never
    patch: operations['\u66F4\u65B0\u516C\u544A_api_v1_announcements__announcement_id__patch']
    trace?: never
  }
  '/announcements/{announcement_id}/restore': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u6062\u590D\u516C\u544A_api_v1_announcements__announcement_id__restore_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/friend-links': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u5217\u51FA\u53CB\u94FE_api_v1_friend_links_get']
    put?: never
    post: operations['\u521B\u5EFA\u53CB\u94FE_api_v1_friend_links_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/friend-links/categories': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u5217\u51FA\u53CB\u94FE\u5206\u7C7B_api_v1_friend_links_categories_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/friend-links/public': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u5217\u51FA\u516C\u5F00\u53CB\u94FE_api_v1_friend_links_public_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/friend-links/{friend_link_id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u83B7\u53D6\u53CB\u94FE_api_v1_friend_links__friend_link_id__get']
    put?: never
    post?: never
    delete: operations['\u5220\u9664\u53CB\u94FE_api_v1_friend_links__friend_link_id__delete']
    options?: never
    head?: never
    patch: operations['\u66F4\u65B0\u53CB\u94FE_api_v1_friend_links__friend_link_id__patch']
    trace?: never
  }
  '/friend-links/{friend_link_id}/restore': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u6062\u590D\u53CB\u94FE_api_v1_friend_links__friend_link_id__restore_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/friend-links/exchange': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u4EA4\u6362\u53CB\u94FE_api_v1_friend_links_exchange_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/friend-links/{friend_link_id}/approve': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u6279\u51C6\u53CB\u94FE_api_v1_friend_links__friend_link_id__approve_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/friend-links/{friend_link_id}/reject': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u62D2\u7EDD\u53CB\u94FE_api_v1_friend_links__friend_link_id__reject_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/feed': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['list_feed_api_v1_feed_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/rss.xml': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['rss_feed_api_v1_rss_xml_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/moments': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u5217\u51FA\u52A8\u6001_api_v1_moments_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/moments/public/{moment_id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u83B7\u53D6\u516C\u5F00\u52A8\u6001_api_v1_moments_public__moment_id__get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/moments/{moment_id}/like': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u70B9\u8D5E\u52A8\u6001_api_v1_moments__moment_id__like_post']
    delete: operations['\u53D6\u6D88\u70B9\u8D5E\u52A8\u6001_api_v1_moments__moment_id__like_delete']
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/moments/{moment_id}/view': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u8BB0\u5F55\u52A8\u6001\u6D4F\u89C8_api_v1_moments__moment_id__view_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/moments/draft': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u83B7\u53D6\u8349\u7A3F_api_v1_moments_draft_get']
    put: operations['\u4FDD\u5B58\u8349\u7A3F_api_v1_moments_draft_put']
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/moments/publish': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u53D1\u5E03\u52A8\u6001_api_v1_moments_publish_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/moments/{moment_id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put: operations['\u66F4\u65B0\u52A8\u6001_api_v1_moments__moment_id__put']
    post?: never
    delete: operations['\u5220\u9664\u52A8\u6001_api_v1_moments__moment_id__delete']
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/moments/{moment_id}/images': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u5217\u51FA\u52A8\u6001\u56FE\u7247_api_v1_moments__moment_id__images_get']
    put?: never
    post: operations['\u4E0A\u4F20\u52A8\u6001\u56FE\u7247_api_v1_moments__moment_id__images_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/moments/{moment_id}/images/order': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch: operations['\u91CD\u6392\u52A8\u6001\u56FE\u7247_api_v1_moments__moment_id__images_order_patch']
    trace?: never
  }
  '/moments/{moment_id}/images/{image_id}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post?: never
    delete: operations['\u5220\u9664\u52A8\u6001\u56FE\u7247_api_v1_moments__moment_id__images__image_id__delete']
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/moments/my/list': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u5217\u51FA\u6211\u7684\u52A8\u6001_api_v1_moments_my_list_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/moments/{moment_id}/restore': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get?: never
    put?: never
    post: operations['\u6062\u590D\u52A8\u6001_api_v1_moments__moment_id__restore_post']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/banner-images': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    get: operations['\u5217\u51FA\u6A2A\u5E45\u56FE\u7247_api_v1_banner_images_get']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
}
export type webhooks = Record<string, never>
export interface components {
  schemas: {
    AnnouncementCreate: {
      title: string
      content?: string
      is_active?: boolean
    }
    AnnouncementPublicRead: {
      id: string
      title: string
      content: string
      created_at: string
    }
    AnnouncementRead: {
      id: string
      title: string
      content: string
      is_active: boolean
      is_deleted?: boolean
      deleted_at?: string | null
      created_by: string
      created_at: string
      updated_at: string
    }
    AnnouncementUpdate: {
      title?: string | null
      content?: string | null
      is_active?: boolean | null
    }
    BillAccountCreate: {
      name: string
      type: string
      initial_balance_cent?: number
      note?: string | null
    }
    BillAccountRead: {
      id: string
      name: string
      type: string
      initial_balance_cent: number
      current_balance_cent: number
      note?: string | null
      created_at: string
      updated_at: string
    }
    BillAccountSimpleRead: {
      id: string
      name: string
      type: string
    }
    BillAccountUpdate: {
      name?: string | null
      type?: string | null
      initial_balance_cent?: number | null
      note?: string | null
    }
    BillCategoryCreate: {
      type: string
      name: string
      color?: string
      icon?: string
      sort_order?: number
    }
    BillCategoryRead: {
      id: string
      type: string
      name: string
      color: string
      icon: string
      sort_order: number
      created_at: string
      updated_at: string
    }
    BillCategorySimpleRead: {
      id: string
      type: string
      name: string
      color: string
      icon: string
    }
    BillCategoryUpdate: {
      type?: string | null
      name?: string | null
      color?: string | null
      icon?: string | null
      sort_order?: number | null
    }
    BillMonthSummaryRead: {
      month: string
      income_cent: number
      expense_cent: number
      net_cent: number
      record_count: number
      daily_totals?: components['schemas']['BillSummaryDailyTotalRead'][]
      category_totals?: components['schemas']['BillSummaryCategoryRead'][]
    }
    BillRecordCreate: {
      type: string
      account_id: string
      target_account_id?: string | null
      category_id?: string | null
      amount_cent: number
      merchant?: string | null
      note?: string | null
      occurred_at: string
    }
    BillRecordRead: {
      id: string
      template_id?: string | null
      template_title?: string | null
      type: string
      amount_cent: number
      merchant?: string | null
      note?: string | null
      occurred_at: string
      account: components['schemas']['BillAccountSimpleRead']
      target_account?: components['schemas']['BillAccountSimpleRead'] | null
      category?: components['schemas']['BillCategorySimpleRead'] | null
      created_at: string
      updated_at: string
    }
    BillRecordUpdate: {
      type?: string | null
      account_id?: string | null
      target_account_id?: string | null
      category_id?: string | null
      amount_cent?: number | null
      merchant?: string | null
      note?: string | null
      occurred_at?: string | null
    }
    BillSummaryCategoryRead: {
      category_id: string
      type: string
      name: string
      color: string
      amount_cent: number
      record_count: number
    }
    BillSummaryDailyTotalRead: {
      date: string
      income_cent: number
      expense_cent: number
    }
    BillTemplateCreate: {
      title: string
      type: string
      account_id: string
      target_account_id?: string | null
      category_id?: string | null
      amount_cent: number
      merchant?: string | null
      note?: string | null
      day_of_month: number
      is_active?: boolean
    }
    BillTemplateGenerateResultRead: {
      month: string
      created_count: number
      skipped_count: number
    }
    BillTemplateRead: {
      id: string
      title: string
      type: string
      amount_cent: number
      merchant?: string | null
      note?: string | null
      day_of_month: number
      is_active: boolean
      account: components['schemas']['BillAccountSimpleRead']
      target_account?: components['schemas']['BillAccountSimpleRead'] | null
      category?: components['schemas']['BillCategorySimpleRead'] | null
      created_at: string
      updated_at: string
    }
    BillTemplateUpdate: {
      title?: string | null
      type?: string | null
      account_id?: string | null
      target_account_id?: string | null
      category_id?: string | null
      amount_cent?: number | null
      merchant?: string | null
      note?: string | null
      day_of_month?: number | null
      is_active?: boolean | null
    }
    Body_AI___api_v1_ai_chat_post: {
      messages?: string | null
      files?: string[] | null
    }
    Body________api_v1_articles__article_id__images_post: {
      file: string
    }
    Body________api_v1_media__media_id__assets_upload_cover_post: {
      file: string
    }
    Body________api_v1_moments__moment_id__images_post: {
      file: string
    }
    Body______api_v1_files_post: {
      file: string
      folder_id?: string | null
    }
    FileArchiveRequest: {
      folder_ids?: string[]
      file_ids?: string[]
      archive_name?: string | null
    }
    FileBreadcrumbRead: {
      id: string | null
      name: string
    }
    FileExplorerRead: {
      current_folder: components['schemas']['FileFolderRead'] | null
      breadcrumbs: components['schemas']['FileBreadcrumbRead'][]
      tree: components['schemas']['FileFolderTreeNodeRead'][]
      folders: components['schemas']['FileFolderRead'][]
      files: components['schemas']['FileRead'][]
    }
    FileFolderCreate: {
      name: string
      parent_id?: string | null
    }
    FileFolderMove: {
      parent_id?: string | null
    }
    FileFolderRead: {
      id: string
      parent_id: string | null
      name: string
      created_at: string
      updated_at: string
    }
    FileFolderRename: {
      name: string
    }
    FileFolderSearchRead: {
      id: string
      parent_id: string | null
      name: string
      path: string
      updated_at: string
    }
    FileFolderTreeNodeRead: {
      id: string
      parent_id: string | null
      name: string
      children: components['schemas']['FileFolderTreeNodeRead'][]
    }
    FileMove: {
      folder_id?: string | null
    }
    FileRead: {
      id: string
      folder_id: string | null
      purpose: 'file' | 'article_image' | 'moment_image' | 'media_asset'
      original_name: string
      url: string
      thumbnail_url: string | null
      size: number
      mime_type: string
      created_at: string
      updated_at: string | null
      article_id: string | null
      article_title: string | null
      moment_id: string | null
      moment_title: string | null
      media_item_id: string | null
      media_title: string | null
      media_asset_type: string | null
    }
    FileRename: {
      original_name: string
    }
    FileSearchItemRead: {
      id: string
      folder_id: string | null
      purpose: 'file' | 'article_image' | 'moment_image' | 'media_asset'
      original_name: string
      url: string
      thumbnail_url: string | null
      size: number
      mime_type: string
      created_at: string
      updated_at: string | null
      path: string
      article_id: string | null
      article_title: string | null
      moment_id: string | null
      moment_title: string | null
      media_item_id: string | null
      media_title: string | null
      media_asset_type: string | null
    }
    FileSearchRead: {
      folders: components['schemas']['FileFolderSearchRead'][]
      files: components['schemas']['FileSearchItemRead'][]
    }
    FileTrashItemRead: {
      id: string
      type: 'file' | 'folder'
      name: string
      original_parent_id: string | null
      path: string
      deleted_at: string
      purge_after: string
      remaining_days: number
      size: number | null
      mime_type: string | null
    }
    FileTrashRead: {
      items: components['schemas']['FileTrashItemRead'][]
    }
    HTTPValidationError: {
      detail?: components['schemas']['ValidationError'][]
    }
    HolidayCalendarYearRead: {
      year: number
      supported: boolean
      holiday_dates: string[]
      workday_dates: string[]
    }
    'MCP______-Input': {
      device_name?: string
      scope?: components['schemas']['app__modules__auth__device_models__________2']
      client_version?: string | null
      platform?: string | null
    }
    'MCP______-Output': {
      token: string
      expires_at: string
      session: components['schemas']['app__modules__auth__device_schemas__________2']
    }
    PaginatedResponse: {
      items: unknown[]
      total: number
      page: number
      page_size: number
      pages: number
    }
    PaginatedResponse______: {
      items: components['schemas']['app__modules__materials__schemas______-Output'][]
      total: number
      page: number
      page_size: number
      pages: number
    }
    RecurrenceType:
      | 'none'
      | 'daily'
      | 'weekly'
      | 'monthly'
      | 'yearly'
      | 'workday'
      | 'weekend'
      | 'holiday'
      | 'custom'
    TodoCreate: {
      title: string
      description?: string | null
      importance?: number
      urgency?: number
      start_date?: string | null
      end_date?: string | null
      is_pinned?: boolean
      tags?: string[] | null
      recurrence_type?: components['schemas']['RecurrenceType']
      recurrence_interval?: number
      recurrence_count?: number
      times_per_interval?: number
    }
    TodoRead: {
      id: string
      title: string
      description: string | null
      status: components['schemas']['TodoStatus']
      importance: number
      urgency: number
      start_date: string | null
      end_date: string | null
      is_pinned: boolean
      is_deleted: boolean
      deleted_at: string | null
      tags: string[] | null
      recurrence_type: components['schemas']['RecurrenceType']
      recurrence_interval: number
      recurrence_count: number
      times_per_interval: number
      interval_progress: number
      progress_reset_at: string | null
      created_at: string
      updated_at: string
    }
    TodoStatus: 'todo' | 'done'
    TodoTagRead: {
      name: string
      count: number
    }
    TodoUpdate: {
      title?: string | null
      description?: string | null
      status?: components['schemas']['TodoStatus'] | null
      importance?: number | null
      urgency?: number | null
      start_date?: string | null
      end_date?: string | null
      is_pinned?: boolean | null
      is_deleted?: boolean | null
      tags?: string[] | null
      recurrence_type?: components['schemas']['RecurrenceType'] | null
      recurrence_interval?: number | null
      recurrence_count?: number | null
      times_per_interval?: number | null
      interval_progress?: number | null
    }
    'Twikoo______-Input': {
      password: string
    }
    'Twikoo______-Output': {
      available: boolean
      detail: string
      last_reset_password?: string | null
      last_reset_at?: string | null
    }
    ValidationError: {
      loc: (string | number)[]
      msg: string
      type: string
      input?: unknown
      ctx?: Record<string, never>
    }
    WidgetPublicSummaryRead: {
      pending_count: number
      pinned_count: number
      overdue_count: number
      due_today_count: number
      items: components['schemas']['WidgetTodoSummaryItemRead'][]
    }
    WidgetSummaryRead: {
      user_id: string
      username: string
      nickname?: string | null
      pending_count: number
      pinned_count: number
      overdue_count: number
      due_today_count: number
      items: components['schemas']['WidgetTodoSummaryItemRead'][]
    }
    WidgetTodoSummaryItemRead: {
      id: string
      title: string
      is_pinned: boolean
      importance: number
      urgency: number
      end_date?: string | null
    }
    '__AI______-Input': {
      title?: string | null
      content: string
      excerpt?: string | null
      category_names?: string[]
      tag_names?: string[]
      mode?: string
    }
    '__AI______-Output': {
      content: string
      summary?: string
    }
    '__AI_______-Input': {
      title?: string | null
      content: string
      excerpt?: string | null
      category_names?: string[]
      tag_names?: string[]
    }
    '__AI_______-Output': {
      title: string
      excerpt: string
      category_name?: string | null
      tag_names?: string[]
      reason?: string
    }
    '_________-Input': {
      device_name?: string
      client_version?: string | null
      platform?: string | null
    }
    app__modules__ai_chat__schemas__AI______1: {
      enabled?: boolean | null
      access_policy?: 'login' | null
      provider?: string | null
      base_url?: string | null
      model?: string | null
      max_tokens?: number | null
      timeout_seconds?: number | null
      system_prompt?: string | null
      allow_attachments?: boolean | null
      max_attachment_size_mb?: number | null
      daily_limit_per_user?: number | null
    }
    app__modules__ai_chat__schemas__AI______2: {
      secret: string
    }
    app__modules__ai_chat__schemas__AI______3: {
      message: string
    }
    app__modules__ai_chat__schemas__AI______4: {
      enabled: boolean
      access_policy: 'login'
      provider: string
      base_url: string
      model: string
      max_tokens: number
      timeout_seconds: number
      system_prompt: string
      allow_attachments: boolean
      max_attachment_size_mb: number
      daily_limit_per_user: number
      has_secret: boolean
      secret_updated_at?: string | null
      updated_at?: string | null
    }
    app__modules__ai_chat__schemas__AI______5: {
      content: string
      duration_ms: number
    }
    app__modules__ai_chat__schemas__AI________1: {
      id: string
      user_id: string | null
      provider: string
      model: string
      status: string
      prompt_tokens: number | null
      completion_tokens: number | null
      total_tokens: number | null
      duration_ms: number
      message_count: number
      attachment_count: number
      error_type: string | null
      error_message: string | null
      created_at: string
    }
    app__modules__ai_chat__schemas__AI________2: {
      items: components['schemas']['app__modules__ai_chat__schemas__AI________1'][]
      total: number
      page: number
      page_size: number
      pages: number
    }
    app__modules__articles__schemas________1: {
      title: string
      content?: string
      excerpt?: string | null
      cover_url?: string | null
      category_id?: string | null
      tag_ids?: string[]
    }
    app__modules__articles__schemas________2: {
      title?: string | null
      content?: string | null
      excerpt?: string | null
      cover_url?: string | null
      category_id?: string | null
      tag_ids?: string[] | null
      organization_state?: ('inbox' | 'organized' | 'archived') | null
    }
    app__modules__articles__schemas________3: {
      name: string
      description?: string | null
    }
    app__modules__articles__schemas________4: {
      name: string
    }
    app__modules__articles__schemas________5: {
      id: string
      name: string
      slug: string
      created_at: string
    }
    app__modules__articles__schemas________6: {
      id: string
      name: string
      slug: string
      description?: string | null
      article_count?: number
      created_at: string
    }
    app__modules__articles__schemas________7: {
      id: string
      title: string
      slug: string
      content: string
      import_metadata?: {
        [key: string]: unknown
      } | null
      organization_state?: string
      archived_at?: string | null
      converted_items?: components['schemas']['app__modules__articles__schemas__________3'][]
      excerpt?: string | null
      cover_url?: string | null
      status: string
      view_count: number
      like_count: number
      liked?: boolean
      word_count: number
      author: components['schemas']['app__modules__users__schemas______-Output']
      category?: components['schemas']['app__modules__articles__schemas________6'] | null
      tags?: components['schemas']['app__modules__articles__schemas________5'][]
      is_deleted?: boolean
      deleted_at?: string | null
      published_at?: string | null
      created_at: string
      last_edited_at: string
      updated_at: string
      revision?: number
      has_unpublished_changes?: boolean
    }
    'app__modules__articles__schemas_________-Output': {
      id: string
      title: string
      slug: string
      published_at?: string | null
      view_count?: number
      like_count?: number
      author: components['schemas']['app__modules__users__schemas______-Output']
      tags?: components['schemas']['app__modules__articles__schemas________5'][]
      category?: components['schemas']['app__modules__articles__schemas________6'] | null
    }
    app__modules__articles__schemas__________1: {
      visibility?: 'public' | 'login_required'
      expected_revision: number
    }
    app__modules__articles__schemas__________2: {
      title?: string | null
      content?: string | null
      excerpt?: string | null
      cover_url?: string | null
      category_id?: string | null
      tag_ids?: string[] | null
      organization_state?: 'inbox' | 'organized' | 'archived'
    }
    app__modules__articles__schemas__________3: {
      id: string
      target_type: string
      target_id: string
      created_at: string
    }
    app__modules__articles__schemas__________4: {
      like_count: number
      changed: boolean
      liked: boolean
    }
    app__modules__articles__schemas__________5: {
      title: string
      slug: string
    }
    app__modules__articles__schemas__________6: {
      prev?: components['schemas']['app__modules__articles__schemas__________5'] | null
      next?: components['schemas']['app__modules__articles__schemas__________5'] | null
      related: components['schemas']['app__modules__articles__schemas_________-Output'][]
      random: components['schemas']['app__modules__articles__schemas_________-Output'][]
    }
    app__modules__articles__schemas__________7: {
      used_by_publication?: boolean
      id: string
      original_name: string
      url: string
      preview_url: string
      thumbnail_url?: string | null
      size: number
      mime_type: string
      created_at: string
    }
    app__modules__articles__schemas___________1: {
      title: string
      description?: string | null
      start_date?: string | null
      end_date?: string | null
    }
    app__modules__articles__schemas___________2: {
      title: string
      content_text?: string | null
      note?: string | null
      type?: 'text' | 'link'
    }
    app__modules__articles__schemas___________3: {
      visibility: 'public' | 'login_required'
    }
    app__modules__auth__device_models__________1: 'desktop' | 'mcp' | 'phone' | 'other'
    app__modules__auth__device_models__________2: 'full_client' | 'mcp_readonly' | 'mcp_full'
    'app__modules__auth__device_schemas________-Input': {
      username: string
      password: string
      device_name: string
      device_type: components['schemas']['app__modules__auth__device_models__________1']
      scope: components['schemas']['app__modules__auth__device_models__________2']
      client_version?: string | null
      platform?: string | null
    }
    app__modules__auth__device_schemas__________2: {
      id: string
      user_id: string
      device_name: string
      device_type: string
      scope: string
      client_version?: string | null
      platform?: string | null
      last_ip?: string | null
      last_user_agent?: string | null
      expires_at: string
      last_used_at: string
      created_at: string
      revoked_at?: string | null
    }
    app__modules__auth__device_schemas__________3: {
      token: string
      expires_at: string
      session: components['schemas']['app__modules__auth__device_schemas__________2']
      user: components['schemas']['app__modules__users__schemas______-Output']
    }
    app__modules__auth__device_schemas_____________2: {
      token: string
      expires_at: string
      session: components['schemas']['app__modules__auth__device_schemas__________2']
    }
    app__modules__auth__device_schemas_____________3: {
      id: string
      user_id: string
      device_name: string
      device_type: string
      scope: string
      client_version?: string | null
      platform?: string | null
      last_ip?: string | null
      last_user_agent?: string | null
      expires_at: string
      last_used_at: string
      created_at: string
      revoked_at?: string | null
      is_current?: boolean
    }
    app__modules__auth__schemas______: {
      username: string
      password: string
    }
    'app__modules__friend_links__schemas______-Output': {
      id: string
      name: string
      url: string
      description?: string | null
      logo_url?: string | null
      category?: string | null
      status: string
      is_auto_exchange: boolean
      is_deleted?: boolean
      deleted_at?: string | null
      contact_email?: string | null
      contact_name?: string | null
      created_at: string
      updated_at: string
    }
    'app__modules__friend_links__schemas________-Input': {
      name: string
      url: string
      description?: string | null
      logo_url?: string | null
      category?: string | null
      contact_email?: string | null
      contact_name?: string | null
      my_site_url: string
    }
    'app__modules__friend_links__schemas________-Output': {
      id: string
      name: string
      url: string
      description?: string | null
      logo_url?: string | null
      category?: string | null
    }
    app__modules__friend_links__schemas________1: {
      name: string
      url: string
      description?: string | null
      logo_url?: string | null
      category?: string | null
      contact_email?: string | null
      contact_name?: string | null
    }
    app__modules__friend_links__schemas________2: {
      name?: string | null
      url?: string | null
      description?: string | null
      logo_url?: string | null
      category?: string | null
      status?: string | null
    }
    app__modules__materials__models________1: 'link' | 'text' | 'image' | 'file'
    app__modules__materials__models________2: 'active' | 'archived'
    'app__modules__materials__schemas______-Output': {
      id: string
      type: components['schemas']['app__modules__materials__models________1']
      title: string | null
      content_text: string | null
      note: string | null
      status: components['schemas']['app__modules__materials__models________2']
      tags: string[] | null
      assets: components['schemas']['app__modules__materials__schemas__________3'][]
      archived_at: string | null
      is_deleted: boolean
      deleted_at: string | null
      created_at: string
      updated_at: string
    }
    'app__modules__materials__schemas________-Input': {
      file_id: string
      sort_order?: number
    }
    app__modules__materials__schemas________1: {
      type?: components['schemas']['app__modules__materials__models________1']
      title?: string | null
      content_text?: string | null
      note?: string | null
      status?: components['schemas']['app__modules__materials__models________2']
      tags?: string[] | null
      assets?: components['schemas']['app__modules__materials__schemas________-Input'][] | null
    }
    app__modules__materials__schemas________2: {
      type?: components['schemas']['app__modules__materials__models________1'] | null
      title?: string | null
      content_text?: string | null
      note?: string | null
      status?: components['schemas']['app__modules__materials__models________2'] | null
      tags?: string[] | null
      assets?: components['schemas']['app__modules__materials__schemas________-Input'][] | null
    }
    app__modules__materials__schemas__________: {
      ids: string[]
      status: components['schemas']['app__modules__materials__models________2']
    }
    app__modules__materials__schemas__________2: {
      name: string
      count: number
    }
    app__modules__materials__schemas__________3: {
      id: string
      file_id: string
      sort_order: number
      created_at: string
      file: components['schemas']['FileRead']
    }
    app__modules__media__schemas_______: {
      name: string
      count: number
    }
    app__modules__media__schemas_________: {
      name: string
      count: number
    }
    app__modules__media__schemas__________1: {
      title: string
      original_title?: string | null
      media_type: 'game' | 'novel' | 'book' | 'anime' | 'comic' | 'movie' | 'tv' | 'music' | 'other'
      status: 'planned' | 'doing' | 'done' | 'paused' | 'dropped'
      rating?: number | null
      creator?: string | null
      summary?: string | null
      description?: string | null
      genres?: string[] | null
      tags?: string[] | null
      personal_tags?: string[] | null
      release_date?: string | null
      primary_cover_asset_id?: string | null
      is_visible?: boolean
    }
    app__modules__media__schemas__________2: {
      title?: string | null
      original_title?: string | null
      media_type?:
        ('game' | 'novel' | 'book' | 'anime' | 'comic' | 'movie' | 'tv' | 'music' | 'other') | null
      status?: ('planned' | 'doing' | 'done' | 'paused' | 'dropped') | null
      rating?: number | null
      creator?: string | null
      summary?: string | null
      description?: string | null
      genres?: string[] | null
      tags?: string[] | null
      personal_tags?: string[] | null
      release_date?: string | null
      primary_cover_asset_id?: string | null
      is_visible?: boolean | null
    }
    app__modules__media__schemas__________3: {
      id: string
      media_item_id: string
      asset_type: 'cover' | 'backdrop' | 'screenshot' | 'logo' | 'other'
      storage_key?: string | null
      external_url?: string | null
      thumbnail_url?: string | null
      source_provider?: string | null
      source_asset_id?: string | null
      original_name?: string | null
      mime_type?: string | null
      width?: number | null
      height?: number | null
      size?: number | null
      attribution?: string | null
      license?: string | null
      is_primary: boolean
      sort_order: number
      url?: string | null
      preview_url?: string | null
      created_at: string
      updated_at: string
    }
    app__modules__media__schemas__________4: {
      id: string
      title: string
      original_title?: string | null
      media_type: 'game' | 'novel' | 'book' | 'anime' | 'comic' | 'movie' | 'tv' | 'music' | 'other'
      status: 'planned' | 'doing' | 'done' | 'paused' | 'dropped'
      rating?: number | null
      creator?: string | null
      summary?: string | null
      description?: string | null
      genres?: string[]
      tags?: string[]
      personal_tags?: string[]
      release_date?: string | null
      primary_cover_asset_id?: string | null
      primary_cover_asset?: components['schemas']['app__modules__media__schemas__________3'] | null
      assets?: components['schemas']['app__modules__media__schemas__________3'][]
      external_sources?: components['schemas']['app__modules__media__schemas____________3'][]
      is_visible: boolean
      is_deleted?: boolean
      deleted_at?: string | null
      created_at: string
      updated_at: string
    }
    app__modules__media__schemas__________5: {
      items: components['schemas']['app__modules__media__schemas__________4'][]
      total: number
      page: number
      page_size: number
      pages: number
      all_data_updated_at?: string | null
    }
    app__modules__media__schemas__________6: {
      provider: string
      external_id: string
      title: string
      original_title?: string | null
      media_type: 'game' | 'novel' | 'book' | 'anime' | 'comic' | 'movie' | 'tv' | 'music' | 'other'
      creators?: string[]
      summary?: string | null
      description?: string | null
      genres?: string[]
      tags?: string[]
      release_date?: string | null
      cover_url?: string | null
      thumbnail_url?: string | null
      external_url?: string | null
      raw?: {
        [key: string]: unknown
      } | null
    }
    app__modules__media__schemas____________1: {
      provider: string
      external_id: string
      status?: 'planned' | 'doing' | 'done' | 'paused' | 'dropped'
      rating?: number | null
      is_visible?: boolean
      localize_cover?: boolean
    }
    app__modules__media__schemas____________2: {
      external_url: string
      source_provider?: string | null
      source_asset_id?: string | null
      original_name?: string | null
      attribution?: string | null
      license?: string | null
      set_primary?: boolean
    }
    app__modules__media__schemas____________3: {
      id: string
      media_item_id: string
      provider: string
      external_id: string
      external_url?: string | null
      fetched_at: string
      created_at: string
      updated_at: string
    }
    app__modules__media__schemas____________4: {
      items: components['schemas']['app__modules__media__schemas__________6'][]
    }
    'app__modules__moments__schemas______-Output': {
      id: string
      title?: string | null
      content: string
      is_published: boolean
      view_count: number
      like_count: number
      liked?: boolean
      user_id: string
      images?: components['schemas']['app__modules__moments__schemas__________2'][]
      is_deleted?: boolean
      deleted_at?: string | null
      published_at?: string | null
      created_at: string
      last_edited_at: string
      updated_at: string
    }
    'app__modules__moments__schemas________-Input': {
      title?: string | null
      content: string
    }
    app__modules__moments__schemas________1: {
      title?: string | null
      content: string
    }
    app__modules__moments__schemas________2: {
      title?: string | null
      content: string
    }
    app__modules__moments__schemas__________: {
      image_ids?: string[]
    }
    app__modules__moments__schemas__________2: {
      id: string
      original_name: string
      url: string
      preview_url: string
      thumbnail_url?: string | null
      size: number
      mime_type: string
      sort_order: number
      created_at: string
    }
    app__modules__moments__schemas__________3: {
      id: string
      title?: string | null
      content: string
      view_count: number
      like_count: number
      liked?: boolean
      images?: components['schemas']['app__modules__moments__schemas__________2'][]
      published_at: string
      last_edited_at: string
      user: components['schemas']['app__modules__users__schemas______-Output']
    }
    app__modules__moments__schemas__________4: {
      like_count: number
      changed: boolean
      liked: boolean
    }
    app__modules__moments__schemas__________5: {
      view_count: number
      changed: boolean
    }
    app__modules__moments__schemas__________6: {
      id: string
      title?: string | null
      content: string
      images?: components['schemas']['app__modules__moments__schemas__________2'][]
      is_deleted?: boolean
      deleted_at?: string | null
      last_edited_at: string
      updated_at: string
    }
    app__modules__system__schemas_______: {
      total_articles: number
      total_views: number
      total_todos: number
      current_month_bill_income_cent?: number
      current_month_bill_expense_cent?: number
      current_month_bill_net_cent?: number
      current_month_bill_record_count?: number
      recent_views?: {
        [key: string]: unknown
      }[]
    }
    'app__modules__system__schemas________-Input': {
      comments_enabled?: boolean | null
      comments_hidden?: boolean | null
      tools_enabled?: boolean | null
      ai_chat_enabled?: boolean | null
    }
    app__modules__system__schemas________1: {
      total_articles: number
      total_categories: number
      total_tags: number
      total_words: number
      last_published_at?: string | null
    }
    app__modules__system__schemas________2: {
      cpu_percent: number
      memory_total_gb: number
      memory_used_gb: number
      memory_percent: number
      disk_total_gb: number
      disk_used_gb: number
      disk_percent: number
      uptime_seconds: number
      health: components['schemas']['app__modules__system__schemas__________3']
      runtime: components['schemas']['app__modules__system__schemas_____________3']
    }
    'app__modules__system__schemas__________-Input': {
      path?: string
      article_id?: string | null
    }
    app__modules__system__schemas__________2: {
      status: string
      detail?: string | null
    }
    app__modules__system__schemas__________3: {
      status: string
      checked_at: string
      database: components['schemas']['app__modules__system__schemas__________2']
      redis: components['schemas']['app__modules__system__schemas__________2']
      minio: components['schemas']['app__modules__system__schemas__________2']
    }
    app__modules__system__schemas__________4: {
      comments_enabled?: boolean
      comments_hidden?: boolean
      tools_enabled?: boolean
      ai_chat_enabled?: boolean
    }
    app__modules__system__schemas____________2: {
      start_date: string
      end_date: string
      max_completed_count: number
      total_completed_count: number
      max_score: number
      total_score: number
      days: components['schemas']['app__modules__system__schemas_____________2'][]
    }
    app__modules__system__schemas____________3: {
      method: string
      path: string
      count: number
      last_status_code: number
      last_happened_at: string
      max_duration_ms: number
      avg_duration_ms: number
      detail?: string | null
    }
    app__modules__system__schemas____________4: {
      method: string
      path: string
      status_code: number
      duration_ms: number
      happened_at: string
      detail?: string | null
    }
    app__modules__system__schemas_____________1: {
      todo_id: string
      title: string
      completed_count: number
      normalized_score: number
    }
    app__modules__system__schemas_____________2: {
      date: string
      completed_count: number
      score: number
      items: components['schemas']['app__modules__system__schemas_____________1'][]
    }
    app__modules__system__schemas_____________3: {
      recent_window_minutes: number
      slow_request_threshold_ms: number
      error_count?: number
      slow_request_count?: number
      top_error_routes?: components['schemas']['app__modules__system__schemas____________3'][]
      top_slow_routes?: components['schemas']['app__modules__system__schemas____________3'][]
      recent_errors?: components['schemas']['app__modules__system__schemas____________4'][]
      recent_slow_requests?: components['schemas']['app__modules__system__schemas____________4'][]
    }
    'app__modules__users__schemas______-Input': {
      username?: string | null
      nickname?: string | null
      email?: string | null
      bio?: string | null
      avatar_url?: string | null
      settings?: components['schemas']['app__modules__users__schemas__________1'] | null
    }
    'app__modules__users__schemas______-Output': {
      id: string
      username: string
      nickname?: string | null
      email: string
      avatar_url?: string | null
      bio?: string | null
      settings: components['schemas']['app__modules__users__schemas________-Output']
      is_active: boolean
      created_at: string
    }
    'app__modules__users__schemas________-Output': {
      show_private_articles_on_home?: boolean
    }
    app__modules__users__schemas__________1: {
      show_private_articles_on_home?: boolean | null
    }
    app__modules__users__schemas__________2: {
      current_password: string
      new_password: string
    }
  }
  responses: never
  parameters: never
  requestBodies: never
  headers: never
  pathItems: never
}
export type $defs = Record<string, never>
export interface operations {
  health_check_api_v1_health_get: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__system__schemas__________3']
        }
      }
    }
  }
  login_api_v1_auth_login_post: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['app__modules__auth__schemas______']
      }
    }
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u767B\u51FA\u5F53\u524D\u7528\u6237_api_v1_auth_logout_post': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
    }
  }
  login_device_api_v1_auth_device_login_post: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['app__modules__auth__device_schemas________-Input']
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__auth__device_schemas__________3']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u521B\u5EFA\u684C\u9762\u7AEF\u4EE4\u724C_api_v1_auth_device_token_post': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['_________-Input']
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__auth__device_schemas_____________2']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  logout_device_api_v1_auth_device_logout_post: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
    }
  }
  '\u5217\u51FA\u8BBE\u5907\u4F1A\u8BDD_api_v1_auth_device_sessions_get': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__auth__device_schemas_____________3'][]
        }
      }
    }
  }
  '\u5220\u9664\u5168\u90E8\u8BBE\u5907\u4F1A\u8BDD_api_v1_auth_device_sessions_delete': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
    }
  }
  '\u5220\u9664\u8BBE\u5907\u4F1A\u8BDD_api_v1_auth_device_sessions__session_id__delete': {
    parameters: {
      query?: never
      header?: never
      path: {
        session_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u521B\u5EFAMCP\u4EE4\u724C_api_v1_auth_mcp_token_post': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['MCP______-Input']
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['MCP______-Output']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  'AI\u804A\u5929_api_v1_ai_chat_post': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: {
      content: {
        'multipart/form-data': components['schemas']['Body_AI___api_v1_ai_chat_post']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': unknown
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u83B7\u53D6AI\u8BBE\u7F6E_api_v1_ai_settings_get': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__ai_chat__schemas__AI______4']
        }
      }
    }
  }
  '\u4FDD\u5B58AI\u8BBE\u7F6E_api_v1_ai_settings_patch': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['app__modules__ai_chat__schemas__AI______1']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__ai_chat__schemas__AI______4']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u4FDD\u5B58AI\u5BC6\u94A5_api_v1_ai_secret_patch': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['app__modules__ai_chat__schemas__AI______2']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__ai_chat__schemas__AI______4']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u6D4B\u8BD5AI\u914D\u7F6E_api_v1_ai_test_post': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['app__modules__ai_chat__schemas__AI______3']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__ai_chat__schemas__AI______5']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u83B7\u53D6AI\u8C03\u7528\u65E5\u5FD7_api_v1_ai_logs_get': {
    parameters: {
      query?: {
        page?: number
        page_size?: number
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__ai_chat__schemas__AI________2']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u83B7\u53D6\u8282\u5047\u65E5\u65E5\u5386\u5E74\u4EFD_api_v1_calendar_years__year__get': {
    parameters: {
      query?: never
      header?: {
        'if-none-match'?: string | null
        'if-modified-since'?: string | null
      }
      path: {
        year: number
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HolidayCalendarYearRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  get_me_api_v1_users_me_get: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__users__schemas______-Output']
        }
      }
    }
  }
  update_me_api_v1_users_me_patch: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['app__modules__users__schemas______-Input']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__users__schemas______-Output']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u4FEE\u6539\u6211\u7684\u5BC6\u7801_api_v1_users_me_password_patch': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['app__modules__users__schemas__________2']
      }
    }
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5EFA\u8BAE\u6587\u7AE0\u5143\u4FE1\u606F_api_v1_articles_ai_suggest_metadata_post': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['__AI_______-Input']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['__AI_______-Output']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  'AI\u6DA6\u8272\u6587\u7AE0\u6B63\u6587_api_v1_articles_ai_polish_content_post': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['__AI______-Input']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['__AI______-Output']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5220\u9664\u6587\u7AE0\u56FE\u7247_api_v1_articles__article_id__images__image_id__delete': {
    parameters: {
      query?: never
      header?: never
      path: {
        article_id: string
        image_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  list_all_meta_api_v1_articles_all_meta_get: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__articles__schemas_________-Output'][]
        }
      }
    }
  }
  '\u5217\u51FA\u6587\u7AE0_api_v1_articles_get': {
    parameters: {
      query?: {
        page?: number
        page_size?: number
        category?: string | null
        tag?: string | null
        search?: string | null
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['PaginatedResponse']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u521B\u5EFA\u6587\u7AE0_api_v1_articles_post': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['app__modules__articles__schemas________1']
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__articles__schemas________7']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5217\u51FA\u6211\u7684\u6587\u7AE0_api_v1_articles_my_list_get': {
    parameters: {
      query?: {
        page?: number
        page_size?: number
        is_deleted?: boolean
        organization_state?: string | null
        search?: string | null
        category?: string
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['PaginatedResponse']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5217\u51FA\u6211\u7684\u6587\u7AE0\u5206\u7C7B_api_v1_articles_my_categories_get': {
    parameters: {
      query?: {
        is_deleted?: boolean
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__articles__schemas________6'][]
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u83B7\u53D6\u6211\u7684\u6587\u7AE0_api_v1_articles_my__article_id__get': {
    parameters: {
      query?: {
        is_deleted?: boolean
      }
      header?: never
      path: {
        article_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__articles__schemas________7']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u6587\u7AE0\u8F6C\u5F85\u529E_api_v1_articles_my__article_id__convert_todo_post': {
    parameters: {
      query?: never
      header?: never
      path: {
        article_id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['app__modules__articles__schemas___________1']
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__articles__schemas__________3']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u6587\u7AE0\u8F6C\u8D44\u6599_api_v1_articles_my__article_id__convert_material_post': {
    parameters: {
      query?: never
      header?: never
      path: {
        article_id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['app__modules__articles__schemas___________2']
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__articles__schemas__________3']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u7BA1\u7406\u535A\u5BA2\u5217\u8868_api_v1_articles_blog_manage_get': {
    parameters: {
      query?: {
        page?: number
        page_size?: number
        search?: string | null
        state?: string
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': unknown
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u9884\u89C8\u535A\u5BA2\u5FEB\u7167_api_v1_articles_blog__article_id__snapshot_get': {
    parameters: {
      query?: never
      header?: never
      path: {
        article_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__articles__schemas________7']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u53D1\u5E03\u535A\u5BA2\u5FEB\u7167_api_v1_articles_blog__article_id__publish_post': {
    parameters: {
      query?: never
      header?: never
      path: {
        article_id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['app__modules__articles__schemas__________1']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': unknown
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u66F4\u65B0\u535A\u5BA2\u53EF\u89C1\u6027_api_v1_articles_blog__article_id__visibility_patch': {
    parameters: {
      query?: never
      header?: never
      path: {
        article_id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['app__modules__articles__schemas___________3']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': unknown
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u64A4\u4E0B\u535A\u5BA2_api_v1_articles_blog__article_id__withdraw_post': {
    parameters: {
      query?: never
      header?: never
      path: {
        article_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': unknown
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  get_article_api_v1_articles__slug__get: {
    parameters: {
      query?: never
      header?: never
      path: {
        slug: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__articles__schemas________7']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  like_article_api_v1_articles__slug__like_post: {
    parameters: {
      query?: never
      header?: never
      path: {
        slug: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__articles__schemas__________4']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  unlike_article_api_v1_articles__slug__like_delete: {
    parameters: {
      query?: never
      header?: never
      path: {
        slug: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__articles__schemas__________4']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u83B7\u53D6\u6587\u7AE0\u76F8\u5173_api_v1_articles__slug__related_get': {
    parameters: {
      query?: never
      header?: never
      path: {
        slug: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__articles__schemas__________6']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u521B\u5EFA\u6587\u7AE0\u8349\u7A3F_api_v1_articles_draft_post': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: {
      content: {
        'application/json':
          components['schemas']['app__modules__articles__schemas__________2'] | null
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__articles__schemas________7']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5220\u9664\u6587\u7AE0_api_v1_articles__article_id__delete': {
    parameters: {
      query?: {
        permanent?: boolean
      }
      header?: never
      path: {
        article_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u66F4\u65B0\u6587\u7AE0_api_v1_articles__article_id__patch': {
    parameters: {
      query?: never
      header?: never
      path: {
        article_id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['app__modules__articles__schemas________2']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__articles__schemas________7']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u4E0A\u4F20\u6587\u7AE0\u56FE\u7247_api_v1_articles__article_id__images_post': {
    parameters: {
      query?: never
      header?: never
      path: {
        article_id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        'multipart/form-data': components['schemas']['Body________api_v1_articles__article_id__images_post']
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__articles__schemas__________7']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5217\u51FA\u6587\u7AE0\u56FE\u7247_api_v1_articles_my__article_id__images_get': {
    parameters: {
      query?: never
      header?: never
      path: {
        article_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__articles__schemas__________7'][]
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u6062\u590D\u6587\u7AE0_api_v1_articles__article_id__restore_post': {
    parameters: {
      query?: never
      header?: never
      path: {
        article_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__articles__schemas________7']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5217\u51FA\u5206\u7C7B_api_v1_categories_get': {
    parameters: {
      query?: never
      header?: {
        'if-none-match'?: string | null
        'if-modified-since'?: string | null
      }
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__articles__schemas________6'][]
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u521B\u5EFA\u5206\u7C7B_api_v1_categories_post': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['app__modules__articles__schemas________3']
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__articles__schemas________6']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5217\u51FA\u5168\u90E8\u5206\u7C7B_api_v1_categories_all_get': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__articles__schemas________6'][]
        }
      }
    }
  }
  '\u5220\u9664\u5206\u7C7B_api_v1_categories__category_id__delete': {
    parameters: {
      query?: never
      header?: never
      path: {
        category_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5217\u51FA\u6807\u7B7E_api_v1_tags_get': {
    parameters: {
      query?: never
      header?: {
        'if-none-match'?: string | null
        'if-modified-since'?: string | null
      }
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__articles__schemas________5'][]
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u521B\u5EFA\u6807\u7B7E_api_v1_tags_post': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['app__modules__articles__schemas________4']
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__articles__schemas________5']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5217\u51FA\u5168\u90E8\u6807\u7B7E_api_v1_tags_all_get': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__articles__schemas________5'][]
        }
      }
    }
  }
  '\u5220\u9664\u6807\u7B7E_api_v1_tags__tag_id__delete': {
    parameters: {
      query?: never
      header?: never
      path: {
        tag_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5217\u51FA\u8D44\u6599\u6807\u7B7E_api_v1_materials_tags_get': {
    parameters: {
      query?: {
        is_deleted?: boolean
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__materials__schemas__________2'][]
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5217\u51FA\u8D44\u6599_api_v1_materials_get': {
    parameters: {
      query?: {
        page?: number
        page_size?: number
        status?: string | null
        type?: string | null
        tag?: string | null
        keyword?: string | null
        is_deleted?: boolean
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['PaginatedResponse______']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u521B\u5EFA\u8D44\u6599_api_v1_materials_post': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['app__modules__materials__schemas________1']
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__materials__schemas______-Output']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  get_material_api_v1_materials__material_id__get: {
    parameters: {
      query?: never
      header?: never
      path: {
        material_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__materials__schemas______-Output']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5220\u9664\u8D44\u6599_api_v1_materials__material_id__delete': {
    parameters: {
      query?: {
        permanent?: boolean
      }
      header?: never
      path: {
        material_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u66F4\u65B0\u8D44\u6599_api_v1_materials__material_id__patch': {
    parameters: {
      query?: never
      header?: never
      path: {
        material_id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['app__modules__materials__schemas________2']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__materials__schemas______-Output']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u6062\u590D\u8D44\u6599_api_v1_materials__material_id__restore_post': {
    parameters: {
      query?: never
      header?: never
      path: {
        material_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__materials__schemas______-Output']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u6279\u91CF\u66F4\u65B0\u8D44\u6599\u72B6\u6001_api_v1_materials_batch_status_post': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['app__modules__materials__schemas__________']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': unknown
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  list_todo_tags_api_v1_todos_tags_get: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['TodoTagRead'][]
        }
      }
    }
  }
  list_todos_api_v1_todos_get: {
    parameters: {
      query?: {
        status?: components['schemas']['TodoStatus'] | null
        tag?: string | null
        is_deleted?: boolean
        is_pinned?: boolean | null
        sort_by?: string
        sort_desc?: boolean
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['TodoRead'][]
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  create_todo_api_v1_todos_post: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['TodoCreate']
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['TodoRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  delete_todo_api_v1_todos__todo_id__delete: {
    parameters: {
      query?: {
        permanent?: boolean
      }
      header?: never
      path: {
        todo_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  update_todo_api_v1_todos__todo_id__patch: {
    parameters: {
      query?: never
      header?: never
      path: {
        todo_id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['TodoUpdate']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['TodoRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  toggle_pin_api_v1_todos__todo_id__toggle_pin_post: {
    parameters: {
      query?: never
      header?: never
      path: {
        todo_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['TodoRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  complete_todo_api_v1_todos__todo_id__complete_post: {
    parameters: {
      query?: {
        occurred_on?: string | null
      }
      header?: never
      path: {
        todo_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['TodoRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u53D6\u6D88\u5B8C\u6210\u5F85\u529E_api_v1_todos__todo_id__uncomplete_post': {
    parameters: {
      query?: {
        occurred_on?: string | null
      }
      header?: never
      path: {
        todo_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['TodoRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  restore_todo_api_v1_todos__todo_id__restore_post: {
    parameters: {
      query?: never
      header?: never
      path: {
        todo_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['TodoRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u83B7\u53D6\u8D26\u5355\u8D26\u6237\u5217\u8868_api_v1_bills_accounts_get': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['BillAccountRead'][]
        }
      }
    }
  }
  '\u521B\u5EFA\u8D26\u5355\u8D26\u6237_api_v1_bills_accounts_post': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['BillAccountCreate']
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['BillAccountRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  remove_bill_account_api_v1_bills_accounts__account_id__delete: {
    parameters: {
      query?: never
      header?: never
      path: {
        account_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  patch_bill_account_api_v1_bills_accounts__account_id__patch: {
    parameters: {
      query?: never
      header?: never
      path: {
        account_id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['BillAccountUpdate']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['BillAccountRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u83B7\u53D6\u8D26\u5355\u5206\u7C7B\u5217\u8868_api_v1_bills_categories_get': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['BillCategoryRead'][]
        }
      }
    }
  }
  '\u521B\u5EFA\u8D26\u5355\u5206\u7C7B_api_v1_bills_categories_post': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['BillCategoryCreate']
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['BillCategoryRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u79FB\u9664\u8D26\u5355\u5206\u7C7B_api_v1_bills_categories__category_id__delete': {
    parameters: {
      query?: never
      header?: never
      path: {
        category_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  patch_bill_category_api_v1_bills_categories__category_id__patch: {
    parameters: {
      query?: never
      header?: never
      path: {
        category_id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['BillCategoryUpdate']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['BillCategoryRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u83B7\u53D6\u8D26\u5355\u6A21\u677F\u5217\u8868_api_v1_bills_templates_get': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['BillTemplateRead'][]
        }
      }
    }
  }
  '\u521B\u5EFA\u8D26\u5355\u6A21\u677F_api_v1_bills_templates_post': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['BillTemplateCreate']
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['BillTemplateRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u79FB\u9664\u8D26\u5355\u6A21\u677F_api_v1_bills_templates__template_id__delete': {
    parameters: {
      query?: never
      header?: never
      path: {
        template_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  patch_bill_template_api_v1_bills_templates__template_id__patch: {
    parameters: {
      query?: never
      header?: never
      path: {
        template_id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['BillTemplateUpdate']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['BillTemplateRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u751F\u6210\u8D26\u5355\u6A21\u677F\u63A5\u53E3_api_v1_bills_templates_generate_post': {
    parameters: {
      query?: {
        month?: string | null
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['BillTemplateGenerateResultRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u83B7\u53D6\u8D26\u5355\u8BB0\u5F55\u5217\u8868_api_v1_bills_records_get': {
    parameters: {
      query?: {
        page?: number
        page_size?: number
        month?: string | null
        type?: string | null
        account_id?: string | null
        category_id?: string | null
        keyword?: string | null
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['PaginatedResponse']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u521B\u5EFA\u8D26\u5355\u8BB0\u5F55_api_v1_bills_records_post': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['BillRecordCreate']
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['BillRecordRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  remove_bill_record_api_v1_bills_records__record_id__delete: {
    parameters: {
      query?: never
      header?: never
      path: {
        record_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  patch_bill_record_api_v1_bills_records__record_id__patch: {
    parameters: {
      query?: never
      header?: never
      path: {
        record_id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['BillRecordUpdate']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['BillRecordRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  get_month_summary_api_v1_bills_summary_get: {
    parameters: {
      query?: {
        month?: string | null
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['BillMonthSummaryRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u83B7\u53D6\u8D44\u6E90\u7BA1\u7406\u5668\u6570\u636E_api_v1_files_explorer_get': {
    parameters: {
      query?: {
        folder_id?: string | null
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['FileExplorerRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u641C\u7D22\u8D44\u6E90_api_v1_files_search_get': {
    parameters: {
      query: {
        keyword: string
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['FileSearchRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5217\u51FA\u56DE\u6536\u7AD9\u8D44\u6E90_api_v1_files_trash_get': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['FileTrashRead']
        }
      }
    }
  }
  '\u4E0B\u8F7D\u5F52\u6863_api_v1_files_archive_download_post': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['FileArchiveRequest']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': unknown
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u4E0A\u4F20\u6587\u4EF6_api_v1_files_post': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'multipart/form-data': components['schemas']['Body______api_v1_files_post']
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['FileRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u521B\u5EFA\u6587\u4EF6\u5939_api_v1_files_folders_post': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['FileFolderCreate']
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['FileFolderRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u91CD\u547D\u540D\u6587\u4EF6\u5939_api_v1_files_folders__folder_id__rename_patch': {
    parameters: {
      query?: never
      header?: never
      path: {
        folder_id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['FileFolderRename']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['FileFolderRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u79FB\u52A8\u6587\u4EF6\u5939_api_v1_files_folders__folder_id__move_patch': {
    parameters: {
      query?: never
      header?: never
      path: {
        folder_id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['FileFolderMove']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['FileFolderRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5220\u9664\u6587\u4EF6\u5939_api_v1_files_folders__folder_id__delete': {
    parameters: {
      query?: never
      header?: never
      path: {
        folder_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u6062\u590D\u6587\u4EF6\u5939_api_v1_files_folders__folder_id__restore_post': {
    parameters: {
      query?: never
      header?: never
      path: {
        folder_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5F7B\u5E95\u5220\u9664\u6587\u4EF6\u5939_api_v1_files_folders__folder_id__purge_delete': {
    parameters: {
      query?: never
      header?: never
      path: {
        folder_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u79FB\u52A8\u6587\u4EF6_api_v1_files__file_id__move_patch': {
    parameters: {
      query?: never
      header?: never
      path: {
        file_id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['FileMove']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['FileRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u91CD\u547D\u540D\u6587\u4EF6_api_v1_files__file_id__rename_patch': {
    parameters: {
      query?: never
      header?: never
      path: {
        file_id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['FileRename']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['FileRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5220\u9664\u6587\u4EF6_api_v1_files__file_id__delete': {
    parameters: {
      query?: never
      header?: never
      path: {
        file_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u6062\u590D\u6587\u4EF6_api_v1_files__file_id__restore_post': {
    parameters: {
      query?: never
      header?: never
      path: {
        file_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5F7B\u5E95\u5220\u9664\u6587\u4EF6_api_v1_files__file_id__purge_delete': {
    parameters: {
      query?: never
      header?: never
      path: {
        file_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5217\u51FA\u6587\u5A31\u7C7B\u578B_api_v1_media_types_get': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__media__schemas_______'][]
        }
      }
    }
  }
  '\u5217\u51FA\u6587\u5A31\u5B50\u5206\u7C7B_api_v1_media_genres_get': {
    parameters: {
      query?: {
        media_type?: string | null
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__media__schemas_______'][]
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5217\u51FA\u6587\u5A31\u6807\u7B7E_api_v1_media_tags_get': {
    parameters: {
      query?: {
        media_type?: string | null
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__media__schemas_______'][]
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5217\u51FA\u6587\u5A31\u4E2A\u4EBA\u6807\u7B7E_api_v1_media_personal_tags_get': {
    parameters: {
      query?: {
        media_type?: string | null
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__media__schemas_______'][]
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5217\u51FA\u6587\u5A31\u521B\u4F5C\u8005\u5EFA\u8BAE_api_v1_media_creators_get': {
    parameters: {
      query?: {
        keyword?: string | null
        limit?: number
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__media__schemas_________'][]
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5217\u51FA\u6587\u5A31_api_v1_media_get': {
    parameters: {
      query?: {
        page?: number
        page_size?: number
        media_type?: string | null
        status?: string | null
        rating?: number | null
        keyword?: string | null
        genre?: string | null
        tag?: string | null
        personal_tag?: string | null
        is_deleted?: boolean
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__media__schemas__________5']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u521B\u5EFA\u6587\u5A31_api_v1_media_post': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['app__modules__media__schemas__________1']
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__media__schemas__________4']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u641C\u7D22\u5916\u90E8\u6587\u5A31_api_v1_media_external_search_get': {
    parameters: {
      query: {
        keyword: string
        media_type?: string | null
        provider?: string | null
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__media__schemas____________4']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u83B7\u53D6\u5916\u90E8\u6587\u5A31\u8BE6\u60C5_api_v1_media_external__provider___external_id__get': {
    parameters: {
      query?: never
      header?: never
      path: {
        provider: string
        external_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__media__schemas__________6']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u4ECE\u5916\u90E8\u5019\u9009\u5BFC\u5165\u6587\u5A31_api_v1_media_import_post': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['app__modules__media__schemas____________1']
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__media__schemas__________4']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5217\u51FA\u516C\u5F00\u6587\u5A31_api_v1_media_public_get': {
    parameters: {
      query?: {
        page?: number
        page_size?: number
        media_type?: string | null
        status?: string | null
        rating?: number | null
        keyword?: string | null
        genre?: string | null
        tag?: string | null
        personal_tag?: string | null
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__media__schemas__________5']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u83B7\u53D6\u516C\u5F00\u6587\u5A31\u8BE6\u60C5_api_v1_media_public__media_id__get': {
    parameters: {
      query?: never
      header?: never
      path: {
        media_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__media__schemas__________4']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u83B7\u53D6\u6587\u5A31\u8BE6\u60C5_api_v1_media__media_id__get': {
    parameters: {
      query?: never
      header?: never
      path: {
        media_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__media__schemas__________4']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5220\u9664\u6587\u5A31_api_v1_media__media_id__delete': {
    parameters: {
      query?: {
        permanent?: boolean
      }
      header?: never
      path: {
        media_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u66F4\u65B0\u6587\u5A31_api_v1_media__media_id__patch': {
    parameters: {
      query?: never
      header?: never
      path: {
        media_id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['app__modules__media__schemas__________2']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__media__schemas__________4']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u4ECE\u5916\u90E8URL\u5BFC\u5165\u5C01\u9762_api_v1_media__media_id__assets_import_cover_post': {
    parameters: {
      query?: {
        localize?: boolean
      }
      header?: never
      path: {
        media_id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['app__modules__media__schemas____________2']
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__media__schemas__________3']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u4E0A\u4F20\u672C\u5730\u5C01\u9762_api_v1_media__media_id__assets_upload_cover_post': {
    parameters: {
      query?: {
        set_primary?: boolean
      }
      header?: never
      path: {
        media_id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        'multipart/form-data': components['schemas']['Body________api_v1_media__media_id__assets_upload_cover_post']
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__media__schemas__________3']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u6062\u590D\u6587\u5A31_api_v1_media__media_id__restore_post': {
    parameters: {
      query?: never
      header?: never
      path: {
        media_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__media__schemas__________4']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  blog_stats_api_v1_stats_blog_get: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__system__schemas________1']
        }
      }
    }
  }
  dashboard_stats_api_v1_stats_dashboard_get: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__system__schemas_______']
        }
      }
    }
  }
  todo_completion_history_api_v1_stats_todos_completion_history_get: {
    parameters: {
      query: {
        start_date: string
        end_date: string
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__system__schemas____________2']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  post_pageview_api_v1_stats_pageview_post: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['app__modules__system__schemas__________-Input']
      }
    }
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  system_status_api_v1_system_status_get: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__system__schemas________2']
        }
      }
    }
  }
  '\u83B7\u53D6\u516C\u5F00\u8BBE\u7F6E_api_v1_system_public_settings_get': {
    parameters: {
      query?: never
      header?: {
        'if-none-match'?: string | null
        'if-modified-since'?: string | null
      }
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__system__schemas__________4']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  get_settings_api_v1_system_settings_get: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__system__schemas__________4']
        }
      }
    }
  }
  patch_settings_api_v1_system_settings_patch: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['app__modules__system__schemas________-Input']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__system__schemas__________4']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u83B7\u53D6Twikoo\u5BC6\u7801_api_v1_system_twikoo_password_get': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['Twikoo______-Output']
        }
      }
    }
  }
  '\u91CD\u7F6ETwikoo\u5BC6\u7801\u63A5\u53E3_api_v1_system_twikoo_password_reset_post': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['Twikoo______-Input']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['Twikoo______-Output']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  widget_summary_api_v1_widget_summary_get: {
    parameters: {
      query?: {
        limit?: number
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json':
            | components['schemas']['WidgetSummaryRead']
            | components['schemas']['WidgetPublicSummaryRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u83B7\u53D6\u516C\u5F00\u516C\u544A_api_v1_announcements_public_get': {
    parameters: {
      query?: {
        limit?: number
      }
      header?: {
        'if-none-match'?: string | null
        'if-modified-since'?: string | null
      }
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['AnnouncementPublicRead'][]
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u83B7\u53D6\u6700\u65B0\u516C\u544A_api_v1_announcements_public_latest_get': {
    parameters: {
      query?: never
      header?: {
        'if-none-match'?: string | null
        'if-modified-since'?: string | null
      }
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['AnnouncementPublicRead'] | null
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5217\u51FA\u516C\u544A_api_v1_announcements_get': {
    parameters: {
      query?: {
        page?: number
        page_size?: number
        is_deleted?: boolean
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': unknown
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u521B\u5EFA\u516C\u544A_api_v1_announcements_post': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['AnnouncementCreate']
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['AnnouncementRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u83B7\u53D6\u516C\u544A_api_v1_announcements__announcement_id__get': {
    parameters: {
      query?: never
      header?: never
      path: {
        announcement_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['AnnouncementRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5220\u9664\u516C\u544A_api_v1_announcements__announcement_id__delete': {
    parameters: {
      query?: {
        permanent?: boolean
      }
      header?: never
      path: {
        announcement_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u66F4\u65B0\u516C\u544A_api_v1_announcements__announcement_id__patch': {
    parameters: {
      query?: never
      header?: never
      path: {
        announcement_id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['AnnouncementUpdate']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['AnnouncementRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u6062\u590D\u516C\u544A_api_v1_announcements__announcement_id__restore_post': {
    parameters: {
      query?: never
      header?: never
      path: {
        announcement_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['AnnouncementRead']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5217\u51FA\u53CB\u94FE_api_v1_friend_links_get': {
    parameters: {
      query?: {
        page?: number
        page_size?: number
        status?: string | null
        is_deleted?: boolean
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['PaginatedResponse']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u521B\u5EFA\u53CB\u94FE_api_v1_friend_links_post': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['app__modules__friend_links__schemas________1']
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__friend_links__schemas______-Output']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5217\u51FA\u53CB\u94FE\u5206\u7C7B_api_v1_friend_links_categories_get': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': string[]
        }
      }
    }
  }
  '\u5217\u51FA\u516C\u5F00\u53CB\u94FE_api_v1_friend_links_public_get': {
    parameters: {
      query?: never
      header?: {
        'if-none-match'?: string | null
        'if-modified-since'?: string | null
      }
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__friend_links__schemas________-Output'][]
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u83B7\u53D6\u53CB\u94FE_api_v1_friend_links__friend_link_id__get': {
    parameters: {
      query?: never
      header?: never
      path: {
        friend_link_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__friend_links__schemas______-Output']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5220\u9664\u53CB\u94FE_api_v1_friend_links__friend_link_id__delete': {
    parameters: {
      query?: {
        permanent?: boolean
      }
      header?: never
      path: {
        friend_link_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u66F4\u65B0\u53CB\u94FE_api_v1_friend_links__friend_link_id__patch': {
    parameters: {
      query?: never
      header?: never
      path: {
        friend_link_id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['app__modules__friend_links__schemas________2']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__friend_links__schemas______-Output']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u6062\u590D\u53CB\u94FE_api_v1_friend_links__friend_link_id__restore_post': {
    parameters: {
      query?: never
      header?: never
      path: {
        friend_link_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__friend_links__schemas______-Output']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u4EA4\u6362\u53CB\u94FE_api_v1_friend_links_exchange_post': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['app__modules__friend_links__schemas________-Input']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': {
            [key: string]: unknown
          }
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u6279\u51C6\u53CB\u94FE_api_v1_friend_links__friend_link_id__approve_post': {
    parameters: {
      query?: never
      header?: never
      path: {
        friend_link_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__friend_links__schemas______-Output']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u62D2\u7EDD\u53CB\u94FE_api_v1_friend_links__friend_link_id__reject_post': {
    parameters: {
      query?: never
      header?: never
      path: {
        friend_link_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__friend_links__schemas______-Output']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  list_feed_api_v1_feed_get: {
    parameters: {
      query?: {
        page?: number
        page_size?: number
        category?: string | null
        tag?: string | null
        search?: string | null
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['PaginatedResponse']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  rss_feed_api_v1_rss_xml_get: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
    }
  }
  '\u5217\u51FA\u52A8\u6001_api_v1_moments_get': {
    parameters: {
      query?: {
        page?: number
        page_size?: number
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['PaginatedResponse']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u83B7\u53D6\u516C\u5F00\u52A8\u6001_api_v1_moments_public__moment_id__get': {
    parameters: {
      query?: never
      header?: never
      path: {
        moment_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__moments__schemas__________3']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u70B9\u8D5E\u52A8\u6001_api_v1_moments__moment_id__like_post': {
    parameters: {
      query?: never
      header?: never
      path: {
        moment_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__moments__schemas__________4']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u53D6\u6D88\u70B9\u8D5E\u52A8\u6001_api_v1_moments__moment_id__like_delete': {
    parameters: {
      query?: never
      header?: never
      path: {
        moment_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__moments__schemas__________4']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u8BB0\u5F55\u52A8\u6001\u6D4F\u89C8_api_v1_moments__moment_id__view_post': {
    parameters: {
      query?: never
      header?: never
      path: {
        moment_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__moments__schemas__________5']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u83B7\u53D6\u8349\u7A3F_api_v1_moments_draft_get': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json':
            components['schemas']['app__modules__moments__schemas__________6'] | null
        }
      }
    }
  }
  '\u4FDD\u5B58\u8349\u7A3F_api_v1_moments_draft_put': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['app__modules__moments__schemas________-Input']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__moments__schemas__________6']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u53D1\u5E03\u52A8\u6001_api_v1_moments_publish_post': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['app__modules__moments__schemas________1']
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__moments__schemas______-Output']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u66F4\u65B0\u52A8\u6001_api_v1_moments__moment_id__put': {
    parameters: {
      query?: never
      header?: never
      path: {
        moment_id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['app__modules__moments__schemas________2']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__moments__schemas______-Output']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5220\u9664\u52A8\u6001_api_v1_moments__moment_id__delete': {
    parameters: {
      query?: {
        permanent?: boolean
      }
      header?: never
      path: {
        moment_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5217\u51FA\u52A8\u6001\u56FE\u7247_api_v1_moments__moment_id__images_get': {
    parameters: {
      query?: never
      header?: never
      path: {
        moment_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__moments__schemas__________2'][]
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u4E0A\u4F20\u52A8\u6001\u56FE\u7247_api_v1_moments__moment_id__images_post': {
    parameters: {
      query?: never
      header?: never
      path: {
        moment_id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        'multipart/form-data': components['schemas']['Body________api_v1_moments__moment_id__images_post']
      }
    }
    responses: {
      201: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__moments__schemas__________2']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u91CD\u6392\u52A8\u6001\u56FE\u7247_api_v1_moments__moment_id__images_order_patch': {
    parameters: {
      query?: never
      header?: never
      path: {
        moment_id: string
      }
      cookie?: never
    }
    requestBody: {
      content: {
        'application/json': components['schemas']['app__modules__moments__schemas__________']
      }
    }
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__moments__schemas__________2'][]
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5220\u9664\u52A8\u6001\u56FE\u7247_api_v1_moments__moment_id__images__image_id__delete': {
    parameters: {
      query?: never
      header?: never
      path: {
        moment_id: string
        image_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      204: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5217\u51FA\u6211\u7684\u52A8\u6001_api_v1_moments_my_list_get': {
    parameters: {
      query?: {
        page?: number
        page_size?: number
        is_deleted?: boolean
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['PaginatedResponse']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u6062\u590D\u52A8\u6001_api_v1_moments__moment_id__restore_post': {
    parameters: {
      query?: never
      header?: never
      path: {
        moment_id: string
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['app__modules__moments__schemas______-Output']
        }
      }
      422: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['HTTPValidationError']
        }
      }
    }
  }
  '\u5217\u51FA\u6A2A\u5E45\u56FE\u7247_api_v1_banner_images_get': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': {
            [key: string]: string[]
          }
        }
      }
    }
  }
}
