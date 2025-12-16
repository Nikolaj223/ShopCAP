import { ethers } from "hardhat";
import { Signer } from "ethers";
import * as fs from "fs";
import * as path from "path";

/**
 * Интерфейс для хранения адресов развернутых контрактов.
 * Используется для типизации объекта, который будет записан в JSON-файл для фронтенда.
 */
interface ContractAddresses {
    ShopCAPToken: string;
    PartnerRegistry: string;
    CashbackManager: string;
    ShopCAPPlatform: string;
}

async function main() {
    // Получаем список аккаунтов, доступных в текущей среде Hardhat.
    // deployer будет использоваться для развертывания контрактов.
    const [deployer]: Signer[] = await ethers.getSigners();
    const deployerAddress = await deployer.getAddress();
    console.log("Развертывание контрактов с аккаунта:", deployerAddress);

    // --- 1. Развертывание ShopCAPToken ---
    // Получаем фабрику контракта "ShopCAPToken".
    const ShopCAPTokenFactory = await ethers.getContractFactory("ShopCAPToken");
    // Развертываем контракт.
    const shopCAPToken = await ShopCAPTokenFactory.deploy();
    // Ожидаем завершения транзакции развертывания.
    await shopCAPToken.waitForDeployment();
    // Получаем адрес развернутого контракта.
    const deployedShopCAPTokenAddress = await shopCAPToken.getAddress();
    console.log(
        `ShopCAPToken развернут по адресу: ${deployedShopCAPTokenAddress}`
    );

    // --- 2. Развертывание PartnerRegistry ---
    // Аналогичные шаги для PartnerRegistry.
    const PartnerRegistryFactory = await ethers.getContractFactory(
        "PartnerRegistry"
    );
    const partnerRegistry = await PartnerRegistryFactory.deploy();
    await partnerRegistry.waitForDeployment();
    const deployedPartnerRegistryAddress = await partnerRegistry.getAddress();
    console.log(
        `PartnerRegistry развернут по адресу: ${deployedPartnerRegistryAddress}`
    );

    // --- 3. Развертывание CashbackManager ---
    // Этот контракт принимает параметры при развертывании.
    // _tokenAddress: адрес токена (ShopCAPToken)
    // _partnerRegistryAddress: адрес реестра партнеров (PartnerRegistry)
    // _initialReserveWallet: адрес кошелька, который изначально будет держать резерв токенов.
    //    Здесь используем адрес деплоера.
    const CashbackManagerFactory = await ethers.getContractFactory(
        "CashbackManager"
    );
    const cashbackManager = await CashbackManagerFactory.deploy(
        deployedShopCAPTokenAddress,
        deployedPartnerRegistryAddress,
        deployerAddress
    );
    await cashbackManager.waitForDeployment();
    const deployedCashbackManagerAddress = await cashbackManager.getAddress();
    console.log(
        `CashbackManager развернут по адресу: ${deployedCashbackManagerAddress}`
    );

    // --- 4. Развертывание ShopCAPPlatform ---
    // Этот контракт также принимает параметры при развертывании.
    // _partnerRegistry: адрес реестра партнеров.
    // _cashbackManager: адрес менеджера кешбэка.
    const ShopCAPPlatformFactory = await ethers.getContractFactory(
        "ShopCAPPlatform"
    );
    const shopCAPPlatform = await ShopCAPPlatformFactory.deploy(
        deployedPartnerRegistryAddress,
        deployedCashbackManagerAddress
    );
    await shopCAPPlatform.waitForDeployment();
    const deployedShopCAPPlatformAddress = await shopCAPPlatform.getAddress();
    console.log(
        `ShopCAPPlatform развернут по адресу: ${deployedShopCAPPlatformAddress}`
    );

    // --- Передача прав владения CashbackManager контракту ShopCAPPlatform ---
    // Важный шаг безопасности и логики:
    // Чтобы ShopCAPPlatform мог вызывать функции CashbackManager (например, устанавливать кешбэк,
    // отправлять токены), он должен стать его "владельцем".
    // Предполагается, что CashbackManager использует паттерн Ownable из OpenZeppelin.
    console.log(
        "\nПередача прав владения CashbackManager контракту ShopCAPPlatform..."
    );
    const transferOwnershipTx = await cashbackManager
        .connect(deployer)
        .transferOwnership(deployedShopCAPPlatformAddress);
    await transferOwnershipTx.wait(); // Ожидаем завершения транзакции
    console.log(
        `Права владения CashbackManager успешно переданы ShopCAPPlatform.`
    );

    // --- Сохранение адресов контрактов и ABI для фронтенда ---
    console.log(
        "\nНачинаем генерацию конфигурационных файлов для фронтенда..."
    );

    // Определяем пути к папкам фронтенда относительно текущего скрипта.
    // __dirname - это путь к текущей директории (например, 'your-project/scripts').
    // '..' поднимает на один уровень вверх (до 'your-project/').
    // 'frontend' затем ведет в папку фронтенда.
    const frontendDir = path.join(__dirname, "../frontend");
    // Путь к папке 'src/contracts' внутри фронтенда, где будут храниться адреса и ABI.
    const frontendContractsConfigDir = path.join(
        frontendDir,
        "src",
        "contracts"
    );
    // Путь к подпапке 'abi' внутри 'src/contracts'.
    const frontendAbiDir = path.join(frontendContractsConfigDir, "abi");

    // Проверяем и создаем необходимые директории, если они не существуют.
    // { recursive: true } позволяет создать вложенные папки, если их нет.
    fs.mkdirSync(frontendContractsConfigDir, { recursive: true });
    fs.mkdirSync(frontendAbiDir, { recursive: true });

    // 1. Сохраняем адреса контрактов в JSON-файл
    const contractAddresses: ContractAddresses = {
        ShopCAPToken: deployedShopCAPTokenAddress,
        PartnerRegistry: deployedPartnerRegistryAddress,
        CashbackManager: deployedCashbackManagerAddress,
        ShopCAPPlatform: deployedShopCAPPlatformAddress,
    };
    const addressesFilePath = path.join(
        frontendContractsConfigDir,
        "contract-addresses.json"
    );
    // Записываем объект contractAddresses в JSON-файл.
    // null, 2 делает JSON красиво отформатированным (с отступами в 2 пробела).
    fs.writeFileSync(
        addressesFilePath,
        JSON.stringify(contractAddresses, null, 2)
    );
    console.log(`Адреса контрактов сохранены по адресу: ${addressesFilePath}`);

    // 2. Копируем ABI-файлы контрактов
    // Список имен контрактов, для которых нужно скопировать ABI.
    const contractNames = [
        "ShopCAPToken",
        "PartnerRegistry",
        "CashbackManager",
        "ShopCAPPlatform",
    ];
    for (const name of contractNames) {
        // Путь к артефакту контракта, который генерируется Hardhat после компиляции.
        // Пример: '../artifacts/contracts/ShopCAPToken.sol/ShopCAPToken.json'
        const abiSourcePath = path.join(
            __dirname,
            `../artifacts/contracts/${name}.sol/${name}.json`
        );
        // Путь, куда будет скопирован ABI файл на фронтенде.
        // Пример: 'frontend/src/contracts/abi/ShopCAPToken.json'
        const abiDestPath = path.join(frontendAbiDir, `${name}.json`);

        // Проверяем, существует ли исходный файл ABI.
        if (fs.existsSync(abiSourcePath)) {
            // Читаем весь JSON-файл артефакта. Он содержит не только ABI, но и другие метаданные.
            const fullArtifact = JSON.parse(
                fs.readFileSync(abiSourcePath, "utf8")
            );
            // Записываем ТОЛЬКО массив 'abi' из артефакта в целевой файл на фронтенде.
            fs.writeFileSync(
                abiDestPath,
                JSON.stringify(fullArtifact.abi, null, 2)
            );
            console.log(`ABI для ${name} скопирован в: ${abiDestPath}`);
        } else {
            console.warn(
                `Предупреждение: ABI файл не найден для ${name} по пути ${abiSourcePath}.`
            );
        }
    }
    console.log("Генерация конфигурации фронтенда завершена успешно.");

    // --- Вывод команд для верификации контрактов на Etherscan ---
    // Эти команды позволяют вам подтвердить, что код вашего контракта соответствует тому,
    // что развернуто в сети, делая его публично проверяемым на Block Explorer-ах (например, Etherscan).
    console.log("\n---------- КОМАНДЫ ДЛЯ ВЕРИФИКАЦИИ ----------");
    console.log(
        "ВАЖНО: Сохраните эти команды! Они понадобятся для верификации контрактов на Etherscan (например, для Sepolia)."
    );
    console.log(
        "Для верификации убедитесь, что у вас установлен плагин @nomicfoundation/hardhat-verify и настроен ETHERSCAN_API_KEY в .env файле."
    );
    console.log(
        "Запускайте эти команды ВРУЧНУЮ ПО ОЧЕРЕДИ после развертывания, когда транзакции полностью подтвердятся."
    );

    console.log(`\n// Верификация ShopCAPToken (без аргументов конструктора)`);
    console.log(
        `npx hardhat verify --network sepolia ${deployedShopCAPTokenAddress}`
    );

    console.log(
        `\n// Верификация PartnerRegistry (без аргументов конструктора)`
    );
    console.log(
        `npx hardhat verify --network sepolia ${deployedPartnerRegistryAddress}`
    );

    console.log(
        `\n// Верификация CashbackManager (с аргументами конструктора)`
    );
    // Аргументы конструктора должны быть переданы в точном порядке и типе.
    // ${deployedShopCAPTokenAddress} ${deployedPartnerRegistryAddress} ${deployerAddress}
    console.log(
        `npx hardhat verify --network sepolia ${deployedCashbackManagerAddress} "${deployedShopCAPTokenAddress}" "${deployedPartnerRegistryAddress}" "${deployerAddress}"`
    );

    console.log(
        `\n// Верификация ShopCAPPlatform (с аргументами конструктора)`
    );
    // Аргументы конструктора: ${deployedPartnerRegistryAddress} ${deployedCashbackManagerAddress}
    console.log(
        `npx hardhat verify --network sepolia ${deployedShopCAPPlatformAddress} "${deployedPartnerRegistryAddress}" "${deployedCashbackManagerAddress}"`
    );
    console.log("-------------------------------------------\n");
}

// Вызываем основную функцию и обрабатываем ошибки.
main()
    .then(() => process.exit(0)) // Завершаем процесс с кодом успеха
    .catch((error) => {
        console.error(error); // Выводим ошибку в консоль
        process.exit(1); // Завершаем процесс с кодом ошибки
    });

// // scripts/deploy.ts
// import { ethers } from "hardhat";
// import { Signer } from "ethers"; // Явно импортируем тип Signer

// async function main() {
//     // Получаем аккаунт, который будет выполнять развертывание.
//     // Это будет наш 'deployer'.
//     const [deployer]: Signer[] = await ethers.getSigners();
//     console.log(
//         "Развертывание контрактов с аккаунта:",
//         await deployer.getAddress()
//     );

//     // --- 1. Развертывание ShopCAPToken ---
//     // Конструктор ShopCAPToken ожидает 0 или 1 аргумент.
//     // Если ваш контракт ShopCAPToken.sol имеет пустой конструктор (как часто бывает для ERC20,
//     // где имя, символ и десятичные знаки задаются в базовом ERC20), то deploy() вызывается без аргументов.
//     console.log("Развертывание ShopCAPToken...");
//     const ShopCAPTokenFactory = await ethers.getContractFactory("ShopCAPToken");
//     const shopCAPToken = await ShopCAPTokenFactory.deploy(); // Deploy без аргументов
//     await shopCAPToken.waitForDeployment();
//     const deployedShopCAPTokenAddress = await shopCAPToken.getAddress();
//     console.log(
//         `ShopCAPToken развернут по адресу: ${deployedShopCAPTokenAddress}`
//     );

//     // --- 2. Развертывание PartnerRegistry ---
//     // Конструктор PartnerRegistry, вероятно, не принимает аргументов.
//     console.log("Развертывание PartnerRegistry...");
//     const PartnerRegistryFactory = await ethers.getContractFactory(
//         "PartnerRegistry"
//     );
//     const partnerRegistry = await PartnerRegistryFactory.deploy();
//     await partnerRegistry.waitForDeployment();
//     const deployedPartnerRegistryAddress = await partnerRegistry.getAddress();
//     console.log(
//         `PartnerRegistry развернут по адресу: ${deployedPartnerRegistryAddress}`
//     );

//     // --- 3. Развертывание CashbackManager ---
//     // Конструктор CashbackManager ожидает 3 аргумента:
//     // _shopCapTokenAddress, _partnerRegistryAddress, _initialReserveWallet.
//     // В качестве _initialReserveWallet используем адрес деплоера.
//     console.log("Развертывание CashbackManager...");
//     const CashbackManagerFactory = await ethers.getContractFactory(
//         "CashbackManager"
//     );
//     const cashbackManager = await CashbackManagerFactory.deploy(
//         deployedShopCAPTokenAddress, // _shopCapTokenAddress
//         deployedPartnerRegistryAddress, // _partnerRegistryAddress
//         await deployer.getAddress() // _initialReserveWallet (используем адрес деплоера)
//     );
//     await cashbackManager.waitForDeployment();
//     const deployedCashbackManagerAddress = await cashbackManager.getAddress();
//     console.log(
//         `CashbackManager развернут по адресу: ${deployedCashbackManagerAddress}`
//     );

//     // --- 4. Развертывание ShopCAPPlatform ---
//     // Конструктор ShopCAPPlatform ожидает 2 аргумента:
//     // _partnerRegistryAddress, _cashbackManagerAddress.
//     console.log("Развертывание ShopCAPPlatform...");
//     const ShopCAPPlatformFactory = await ethers.getContractFactory(
//         "ShopCAPPlatform"
//     );
//     const shopCAPPlatform = await ShopCAPPlatformFactory.deploy(
//         deployedPartnerRegistryAddress, // _partnerRegistryAddress
//         deployedCashbackManagerAddress // _cashbackManagerAddress
//     );
//     await shopCAPPlatform.waitForDeployment();
//     const deployedShopCAPPlatformAddress = await shopCAPPlatform.getAddress();
//     console.log(
//         `ShopCAPPlatform развернут по адресу: ${deployedShopCAPPlatformAddress}`
//     );

//     // --- Вывод команд для верификации ---
//     console.log("\n---------- КОМАНДЫ ДЛЯ ВЕРИФИКАЦИИ ----------");
//     console.log(
//         "ЗАПИШИТЕ ИХ! Эти команды понадобятся для верификации на Sepolia Etherscan."
//     );
//     console.log("----- Запустите их по очереди после развертывания -----");

//     console.log(`\n// Верификация ShopCAPToken`);
//     // Аргументы для верификации должны точно соответствовать аргументам конструктора.
//     // Если ShopCAPToken без аргументов, то и здесь без них.
//     console.log(
//         `npx hardhat verify --network sepolia ${deployedShopCAPTokenAddress}`
//     );

//     console.log(`\n// Верификация PartnerRegistry`);
//     console.log(
//         `npx hardhat verify --network sepolia ${deployedPartnerRegistryAddress}`
//     );

//     console.log(`\n// Верификация CashbackManager`);
//     // Аргументы для верификации CashbackManager:
//     // _shopCapTokenAddress, _partnerRegistryAddress, _initialReserveWallet
//     console.log(
//         `npx hardhat verify --network sepolia ${deployedCashbackManagerAddress} ${deployedShopCAPTokenAddress} ${deployedPartnerRegistryAddress} ${await deployer.getAddress()}`
//     );

//     console.log(`\n// Верификация ShopCAPPlatform`);
//     // Аргументы для верификации ShopCAPPlatform:
//     // _partnerRegistryAddress, _cashbackManagerAddress
//     console.log(
//         `npx hardhat verify --network sepolia ${deployedShopCAPPlatformAddress} ${deployedPartnerRegistryAddress} ${deployedCashbackManagerAddress}`
//     );
//     console.log("-------------------------------------------\n");
// }

// // Стандартная обработка ошибок для скриптов Hardhat
// main()
//     .then(() => process.exit(0))
//     .catch((error) => {
//         console.error(error);
//         process.exit(1);
//     });
